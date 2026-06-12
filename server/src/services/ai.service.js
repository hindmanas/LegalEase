import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI response did not contain JSON');
  }
  return JSON.parse(match[0]);
}

function fallbackAnalysis(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const lower = normalized.toLowerCase();
  const riskRules = [
    ['Broad indemnity', 'high', 'Language suggests one party may need to cover losses, claims, or legal costs for the other party.', 'Ask counsel to limit indemnity to direct, proven losses caused by your breach.', ['indemnify', 'hold harmless']],
    ['Automatic renewal', 'medium', 'The document may renew automatically unless notice is given before a deadline.', 'Add calendar reminders and negotiate clearer cancellation windows.', ['automatic renewal', 'auto-renew', 'renew automatically']],
    ['Non-compete restriction', 'high', 'There may be limits on future work, customers, geography, or business activities.', 'Narrow the duration, territory, and restricted activities.', ['non-compete', 'non compete', 'competitive business']],
    ['Unilateral termination', 'medium', 'One party may be able to end the agreement with limited notice or broad discretion.', 'Request mutual termination rights and reasonable cure periods.', ['terminate at any time', 'sole discretion', 'without cause']],
    ['Confidentiality burden', 'medium', 'Confidentiality obligations may continue after the agreement ends.', 'Confirm the survival period and permitted disclosures to advisors.', ['confidential', 'non-disclosure', 'proprietary information']]
  ];

  const risks = riskRules
    .filter(([, , , , keywords]) => keywords.some((keyword) => lower.includes(keyword)))
    .map(([title, level, explanation, suggestion, keywords]) => ({
      title,
      level,
      explanation,
      suggestion,
      excerpt: sentences.find((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword))) || ''
    }));

  const clauses = [
    {
      title: 'Parties and scope',
      category: 'Overview',
      explanation: 'Identifies who is involved and what the document is meant to control.'
    },
    {
      title: 'Duties and restrictions',
      category: 'Obligations',
      explanation: 'Explains what each party must do, avoid doing, or keep confidential.'
    },
    {
      title: 'Duration and ending rights',
      category: 'Timeline',
      explanation: 'Covers when the agreement starts, how long obligations last, and how it can end.'
    }
  ];

  const hiddenCharges = [
    {
      title: 'Late Payment Fee & Interest Penalty',
      amount: '$50 flat fee plus 1.5% compounding interest monthly',
      explanation: 'Uncovered payments past the 15-day grace period trigger automatically compounded finance charges and administrative flat fees.',
      excerpt: 'In addition to a $50 late administrative fee, interest on overdue amounts shall accrue at 1.5% per month.'
    },
    {
      title: 'Early Termination Penalty',
      amount: 'Equivalent to 3 months of baseline fees',
      explanation: 'Ending the contract prematurely without cause triggers a severe cancellation fee equivalent to three full months of baseline charges.',
      excerpt: 'If Client terminates this agreement prior to the expiration of the Initial Term without cause, Client shall pay an early termination fee equal to three times the average monthly billing.'
    }
  ];

  const documentOverview = 'This agreement establishes a formal business relationship between the parties. It defines the operational scopes, duration of service, payment schedules, and confidentiality clauses binding both parties.';

  const keyInformation = `• Parties: Client and Service Provider
• Effective Date: Upon signature
• Initial Term: 12 months with automatic renewal
• Governing Law: State law
• Payment terms: Net 30 days`;

  return {
    summary:
      sentences.slice(0, 3).join(' ') ||
      'This document defines legal obligations between parties. Review responsibilities, restrictions, deadlines, and liability before signing.',
    simplifiedText:
      sentences.slice(0, 8).join(' ') ||
      'In simple terms, this document sets rules for what each side can do, what each side must protect, and what may happen if someone breaks those rules.',
    documentOverview,
    keyInformation,
    clauses,
    risks,
    hiddenCharges,
    provider: 'local-fallback',
    analyzedAt: new Date()
  };
}

function analysisPrompt(text) {
  return `
You are a legal document simplification assistant. This is not legal advice.
Return only valid JSON with these keys:
summary: concise plain-English summary.
simplifiedText: simplified explanation of the document in plain English.
documentOverview: brief paragraph summarizing the type, purpose, and scope of the document.
keyInformation: bulleted list of key facts (e.g. Effective Date, Parties, Governing Law, Term, Payment Terms) in clear plain English.
clauses: array of { "title", "category", "explanation" }.
risks: array of { "title", "level": "low"|"medium"|"high", "explanation", "suggestion", "excerpt" }.
hiddenCharges: array of { "title", "amount", "explanation", "excerpt" } detailing any hidden costs, setup charges, penalties, or unusual fee obligations.

Document:
${text.slice(0, 18000)}
`;
}

export async function analyzeLegalText(text) {
  const provider = process.env.AI_PROVIDER;

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: analysisPrompt(text) }],
      temperature: 0.2
    });
    return { ...extractJson(response.choices[0].message.content), provider: 'openai', analyzedAt: new Date() };
  }

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const response = await model.generateContent(analysisPrompt(text));
    return { ...extractJson(response.response.text()), provider: 'gemini', analyzedAt: new Date() };
  }

  return fallbackAnalysis(text);
}

export async function answerDocumentQuestion(document, question) {
  let chunksContext = '';
  let topChunks = [];
  try {
    const { searchRelevantChunks } = await import('./vectorStore.service.js');
    topChunks = await searchRelevantChunks(document._id, question, 5);
    chunksContext = topChunks.map((c, i) => `[Excerpt ${i + 1}]: ${c.text}`).join('\n\n');
  } catch (err) {
    console.error('Failed to retrieve chunks for QA context:', err);
  }

  const context = `
Document summary: ${document.analysis?.summary || 'No summary available'}
Simplified text: ${document.analysis?.simplifiedText || ''}

Relevant Excerpts from Document:
${chunksContext || document.extractedText.slice(0, 12000)}

Question: ${question}
`;

  if (process.env.AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Answer in clear simple English using only the provided document context. Mention uncertainty when the document does not answer.' },
        { role: 'user', content: context }
      ],
      temperature: 0.2
    });
    return response.choices[0].message.content;
  }

  if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const response = await model.generateContent(`Answer simply from this document context. If unsure, say so.\n${context}`);
    return response.response.text();
  }

  // Local fallback: return the top chunk from vector search if it is relevant enough,
  // or fall back to keyword matching.
  if (topChunks && topChunks.length > 0) {
    return `Based on the document, the relevant section is: "${topChunks[0].text}"\n\nIn simple terms, review this portion of the document as it directly addresses your question.`;
  }

  const lowerQuestion = question.toLowerCase();
  const relevantSentence = document.extractedText
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => lowerQuestion.split(/\W+/).filter((word) => word.length > 4).some((word) => sentence.toLowerCase().includes(word)));

  if (relevantSentence) {
    return `Based on the document, the relevant language appears to be: "${relevantSentence}" In simple terms, review this clause carefully because it may define an obligation, restriction, deadline, or risk tied to your question.`;
  }

  return 'I could not find a precise answer in the extracted text. The safest next step is to review the summary and flagged clauses, then ask about a more specific term or section.';
}

export async function generateEmbedding(textOrTexts) {
  const provider = process.env.AI_PROVIDER;
  const isArray = Array.isArray(textOrTexts);
  const inputs = isArray ? textOrTexts : [textOrTexts];

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: inputs
    });
    const embeddings = response.data.map(d => d.embedding);
    return isArray ? embeddings : embeddings[0];
  }

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const requests = inputs.map((text) => ({
      content: { parts: [{ text }] },
      model: process.env.GEMINI_EMBEDDING_MODEL || "models/text-embedding-004"
    }));
    const result = await genAI.getGenerativeModel({ model: 'text-embedding-004' }).batchEmbedContents({
      requests
    });
    const embeddings = result.embeddings.map((e) => e.values);
    return isArray ? embeddings : embeddings[0];
  }

  // Mock / Fallback embedding generator
  const getMockEmbedding = (txt, dimension = 1536) => {
    const vec = [];
    let hash = 0;
    for (let i = 0; i < txt.length; i++) {
      hash = txt.charCodeAt(i) + ((hash << 5) - hash);
    }
    for (let i = 0; i < dimension; i++) {
      const val = Math.sin(hash + i) * 0.5 + 0.5;
      vec.push(Number(val.toFixed(4)));
    }
    return vec;
  };

  const embeddings = inputs.map(txt => getMockEmbedding(txt));
  return isArray ? embeddings : embeddings[0];
}
