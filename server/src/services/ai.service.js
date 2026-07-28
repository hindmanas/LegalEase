import OpenAI from 'openai';
import Groq from 'groq-sdk';

// Supported Groq models
export const GROQ_MODELS = {
  // Llama 3.3 70B - High performance, great for reasoning, complex tasks like analysis
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',
  // Llama 3.1 8B - High speed, low latency, token efficient, ideal for quick chat/QA
  LLAMA_3_1_8B: 'llama-3.1-8b-instant',
  // Mixtral 8x7B - Strong reasoning capabilities
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  // Gemma 2 9B - Highly efficient instruction tuned model
  GEMMA_2_9B: 'gemma2-9b-it'
};

const groqApiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

function extractJson(text) {
  let cleaned = text.trim();
  // Strip code block markers if any
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI response did not contain JSON');
  }
  const jsonString = match[0];
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn('[AI Service] Direct JSON parse failed, trying relaxed JSON parsing/cleaning.', err.message);
    try {
      const fixedJson = jsonString
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove invalid control characters
      return JSON.parse(fixedJson);
    } catch (fallbackErr) {
      console.error('[AI Service] Failed to parse JSON even after cleaning:', fallbackErr);
      throw new Error(`AI response is not valid JSON: ${fallbackErr.message}. Original text: ${text.slice(0, 200)}`);
    }
  }
}

async function callGroqChatCompletion(groq, messages, modelName) {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: modelName,
      temperature: 0.2,
    });
    return completion.choices[0].message.content;
  } catch (err) {
    console.error(`[Groq AI] Error with model ${modelName}:`, err.message);
    throw err;
  }
}

function analysisPrompt(text, language = 'English') {
  return `
You are a professional legal document analyst. This is not legal advice.
Analyze the following document and generate all content directly in ${language}.
Return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks (\`\`\`json / \`\`\`), do NOT include introductory or concluding text, just the raw JSON object.

The JSON object MUST contain exactly the following keys and data structures:
{
  "documentType": "A single concise phrase identifying the type of document (e.g. 'Lease Agreement', 'Non-Disclosure Agreement', 'Employment Contract') in ${language}.",
  "executiveSummary": "A high-level professional summary of the document in ${language}.",
  "simplifiedSummary": "A non-technical explanation of the document's core terms, written in very simple plain ${language} for a layperson.",
  "keyInformation": "A single string containing a bulleted list of key metadata and critical facts (e.g. Effective Date, Parties, Governing Law, Term, Payment Terms) in clear plain ${language}.",
  "importantClauses": [
    {
      "title": "Clause title in ${language}",
      "category": "Clause category in ${language}",
      "explanation": "Simplified, easy-to-understand explanation of this clause in plain ${language}"
    }
  ],
  "risksRedFlags": [
    {
      "title": "Risk title in ${language}",
      "level": "Strictly one of 'low', 'medium', or 'high'",
      "explanation": "Detailed explanation of why this clause is a risk or red flag in ${language}",
      "suggestion": "Clear suggestion or action item on how to mitigate this risk in ${language}",
      "excerpt": "The exact original language/sentence from the document context representing this risk"
    }
  ],
  "hiddenChargesPenalties": [
    {
      "title": "Charge or penalty title in ${language}",
      "amount": "The amount or percentage (e.g., '$100', '1.5% interest') in ${language}, or 'N/A' if not specified",
      "explanation": "Explanation of the hidden cost, penalty, or fee in ${language}",
      "excerpt": "The exact original language/sentence from the document context representing this charge"
    }
  ],
  "legalObligations": [
    {
      "title": "Title of the obligation in ${language}",
      "obligation": "Clear description of the legal binding covenant or obligation in ${language}"
    }
  ],
  "userResponsibilities": [
    {
      "title": "Title of the responsibility in ${language}",
      "responsibility": "Clear description of what the user/signatory is responsible for doing in ${language}"
    }
  ],
  "missingSuspiciousClauses": [
    {
      "title": "Omitted or suspicious term title in ${language}",
      "explanation": "Explanation of why this clause is missing or why the existing clause is suspicious/unusual in ${language}",
      "impact": "The potential impact of this omission or suspicious clause on the user in ${language}"
    }
  ],
  "recommendations": [
    "A clear, actionable recommendation/next step in ${language} (provide 3 to 5 recommendations)"
  ],
  "relevantLegalReferences": [
    {
      "actName": "Name of the Indian Act or Law in ${language} (e.g., 'Indian Contract Act, 1872', 'Transfer of Property Act, 1882')",
      "sectionArticle": "Relevant Section or Constitutional Article in ${language} (e.g., 'Section 74', 'Section 54', 'Article 21')",
      "whyApplies": "1–2 concise lines explaining why this legal provision applies to the document in ${language}",
      "confidence": "Confidence level strictly matching one of 'high', 'medium', or 'low'"
    }
  ],
  "safetyScore": 75,
  "overallRiskLevel": "Strictly one of 'low', 'medium', or 'high'",
  "finalConclusion": "A final wrap-up statement or summary conclusion in ${language}.",
  "suggestedQuestions": [
    "A relevant, context-specific follow-up question the user might want to ask a chatbot about this document, in ${language} (generate exactly 5 to 6 suggested questions)"
  ]
}

IMPORTANT: For 'relevantLegalReferences', only list relevant Indian statutory provisions (Acts, Sections, or Constitutional Articles) if you are reasonably confident they apply to this document context. Never invent or guess legal references. If no reliable legal provisions can be confidently identified, return an empty array [].

Document:
${text.slice(0, 18000)}
`;
}

export async function analyzeLegalText(text, language = 'English') {
  let analysisResult;
  if (groqApiKey) {
    const groq = new Groq({ apiKey: groqApiKey });
    const model = process.env.GROQ_ANALYSIS_MODEL || GROQ_MODELS.LLAMA_3_3_70B;
    const responseText = await callGroqChatCompletion(groq, [
      { role: 'user', content: analysisPrompt(text, language) }
    ], model);
    analysisResult = extractJson(responseText);
    analysisResult.provider = 'groq';
  } else {
    const provider = process.env.AI_PROVIDER;
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt(text, language) }],
        temperature: 0.2
      });
      analysisResult = extractJson(response.choices[0].message.content);
      analysisResult.provider = 'openai';
    } else {
      throw new Error('AI analysis is not configured. Please ensure GROQ_API_KEY is defined in your server .env file.');
    }
  }

  // Ensure keyInformation is formatted correctly
  if (analysisResult && Array.isArray(analysisResult.keyInformation)) {
    analysisResult.keyInformation = analysisResult.keyInformation.join('\n');
  }
  if (analysisResult && typeof analysisResult.keyInformation !== 'string') {
    analysisResult.keyInformation = String(analysisResult.keyInformation || '');
  }

  // Robust checks and legacy mapping
  if (analysisResult) {
    analysisResult.documentType = analysisResult.documentType || 'Legal Document';
    analysisResult.executiveSummary = analysisResult.executiveSummary || '';
    analysisResult.simplifiedSummary = analysisResult.simplifiedSummary || '';
    analysisResult.importantClauses = Array.isArray(analysisResult.importantClauses) ? analysisResult.importantClauses : [];
    analysisResult.risksRedFlags = Array.isArray(analysisResult.risksRedFlags) ? analysisResult.risksRedFlags : [];
    analysisResult.hiddenChargesPenalties = Array.isArray(analysisResult.hiddenChargesPenalties) ? analysisResult.hiddenChargesPenalties : [];
    analysisResult.legalObligations = Array.isArray(analysisResult.legalObligations) ? analysisResult.legalObligations : [];
    analysisResult.userResponsibilities = Array.isArray(analysisResult.userResponsibilities) ? analysisResult.userResponsibilities : [];
    analysisResult.missingSuspiciousClauses = Array.isArray(analysisResult.missingSuspiciousClauses) ? analysisResult.missingSuspiciousClauses : [];
    analysisResult.relevantLegalReferences = Array.isArray(analysisResult.relevantLegalReferences) ? analysisResult.relevantLegalReferences : [];
    analysisResult.recommendations = Array.isArray(analysisResult.recommendations) ? analysisResult.recommendations : [];
    analysisResult.safetyScore = typeof analysisResult.safetyScore === 'number' ? analysisResult.safetyScore : 50;
    analysisResult.overallRiskLevel = ['low', 'medium', 'high'].includes(analysisResult.overallRiskLevel) ? analysisResult.overallRiskLevel : 'medium';
    analysisResult.finalConclusion = analysisResult.finalConclusion || '';
    analysisResult.suggestedQuestions = Array.isArray(analysisResult.suggestedQuestions) ? analysisResult.suggestedQuestions.slice(0, 6) : [];

    // Legacy fields
    analysisResult.summary = analysisResult.executiveSummary || analysisResult.simplifiedSummary;
    analysisResult.simplifiedText = analysisResult.simplifiedSummary;
    analysisResult.documentOverview = analysisResult.executiveSummary;
    analysisResult.clauses = analysisResult.importantClauses;
    analysisResult.risks = analysisResult.risksRedFlags;
    analysisResult.hiddenCharges = analysisResult.hiddenChargesPenalties;
  }

  analysisResult.analyzedAt = new Date();
  return analysisResult;
}

export async function answerDocumentQuestion(document, question, language = 'English', history = []) {
  let chunksContext = '';
  let topChunks = [];
  try {
    const { searchRelevantChunks } = await import('./vectorStore.service.js');
    topChunks = await searchRelevantChunks(document._id, question, 5);
    chunksContext = topChunks.map((c, i) => `[Excerpt ${i + 1}]: ${c.text}`).join('\n\n');
  } catch (err) {
    console.error('Failed to retrieve chunks for QA context:', err);
  }

  const analysis = document.analysis || {};
  
  const documentContext = `
Document Name: ${document.originalName}
Document Type: ${analysis.documentType || 'Unknown'}
Executive Summary: ${analysis.executiveSummary || analysis.summary || 'None'}
Simplified Summary: ${analysis.simplifiedSummary || analysis.simplifiedText || 'None'}
Safety Score: ${analysis.safetyScore ?? 'N/A'}/100
Risk Level: ${analysis.overallRiskLevel || 'N/A'}

[Important Clauses]:
${(analysis.importantClauses || analysis.clauses || []).slice(0, 15).map(c => `- ${c.title} (${c.category}): ${c.explanation}`).join('\n')}

[Risks & Red Flags]:
${(analysis.risksRedFlags || analysis.risks || []).slice(0, 10).map(r => `- ${r.title} [Level: ${r.level}]: ${r.explanation} (Excerpt: "${r.excerpt || ''}")`).join('\n')}

[Hidden Charges & Penalties]:
${(analysis.hiddenChargesPenalties || analysis.hiddenCharges || []).slice(0, 10).map(h => `- ${h.title} [Amount: ${h.amount || 'N/A'}]: ${h.explanation} (Excerpt: "${h.excerpt || ''}")`).join('\n')}

[Legal Obligations]:
${(analysis.legalObligations || []).slice(0, 10).map(o => `- ${o.title}: ${o.obligation}`).join('\n')}

[User Responsibilities]:
${(analysis.userResponsibilities || []).slice(0, 10).map(r => `- ${r.title}: ${r.responsibility}`).join('\n')}

[Missing/Suspicious Clauses]:
${(analysis.missingSuspiciousClauses || []).slice(0, 10).map(m => `- ${m.title}: ${m.explanation} (Impact: ${m.impact})`).join('\n')}

[Relevant Legal References]:
${(analysis.relevantLegalReferences || []).slice(0, 10).map(ref => `- ${ref.actName} (${ref.sectionArticle || 'N/A'}): ${ref.whyApplies} [Confidence: ${ref.confidence}]`).join('\n')}

[Recommendations]:
${(analysis.recommendations || []).slice(0, 10).map(r => `- ${r}`).join('\n')}

[Relevant Excerpts from Document]:
${chunksContext || document.extractedText.slice(0, 12000)}
`;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const systemPrompt = `You are a helpful, expert Indian Legal AI Assistant.
The user is asking questions about an uploaded legal document.
You must answer using the uploaded document, its stored analysis, retrieved context, and the chat history.

Current Date: ${dateStr}
Current Day: ${dayStr}
Current Time: ${timeStr}

Strict Guidelines:
1. Act as a specialized Indian Legal AI Assistant. Whenever appropriate, mention relevant Indian Acts, Sections, or Constitutional Articles (e.g. Indian Contract Act, 1872; Specific Relief Act, 1963; Transfer of Property Act, 1882; Arbitration and Conciliation Act, 1996; Companies Act, 2013; Constitution of India, etc.) only if you are reasonably confident in their applicability to the context or document.
2. NEVER guess, fabricate, or make up legal provisions, acts, sections, or articles. If you are uncertain of the exact legal provision or act, you must clearly state in ${language} that the exact legal provision cannot be confidently identified.
3. If the user's question is related to the document (e.g. asking about obligations, termination, risks, clauses, summary, details, specific terms, etc.), you must answer it accurately based on the provided document context and analysis.
4. If the user's question is a simple greeting (like "hi", "hello", "hey"), or a basic query about today's date, day, or time, answer it directly using the current date/day/time provided.
5. If the user's question is completely unrelated to the document or legal context (e.g., "how to communicate", "how to calculate bmi", "how to code", general knowledge, history, math, health, cooking, etc.), you must politely decline to answer. State clearly that you can only answer questions related to the document or legal analysis.
6. Your response must be generated ENTIRELY in ${language} (including all legal reasoning, references, and greetings).

Here is the document context and analysis:
${documentContext}`;

  if (groqApiKey) {
    const groq = new Groq({ apiKey: groqApiKey });
    const model = process.env.GROQ_CHAT_MODEL || GROQ_MODELS.LLAMA_3_1_8B;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (Array.isArray(history)) {
      history.slice(-10).forEach(msg => {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        if (msg.content && !msg.content.includes("Selected Language:")) {
          messages.push({ role, content: msg.content });
        }
      });
    }

    messages.push({ role: 'user', content: question });

    const responseText = await callGroqChatCompletion(groq, messages, model);
    return responseText;
  }

  if (process.env.AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (Array.isArray(history)) {
      history.slice(-10).forEach(msg => {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        if (msg.content && !msg.content.includes("Selected Language:")) {
          messages.push({ role, content: msg.content });
        }
      });
    }

    messages.push({ role: 'user', content: question });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.2
    });
    return response.choices[0].message.content;
  }

  throw new Error('AI chat is not configured. Please ensure GROQ_API_KEY is defined in your server .env file.');
}

export async function generateEmbedding(textOrTexts) {
  const isArray = Array.isArray(textOrTexts);
  const inputs = isArray ? textOrTexts : [textOrTexts];

  const provider = process.env.AI_PROVIDER;
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: inputs
    });
    const embeddings = response.data.map(d => d.embedding);
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
