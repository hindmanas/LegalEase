import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI response did not contain JSON');
  }
  return JSON.parse(match[0]);
}

function fallbackAnalysis(text, language = 'English') {
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

  let risks = riskRules
    .filter(([, , , , keywords]) => keywords.some((keyword) => lower.includes(keyword)))
    .map(([title, level, explanation, suggestion, keywords]) => {
      let localizedTitle = title;
      let localizedExplanation = explanation;
      let localizedSuggestion = suggestion;
      
      if (language === 'Hindi') {
        const hindiMap = {
          'Broad indemnity': ['व्यापक क्षतिपूर्ति', 'भाषा से पता चलता है कि एक पक्ष को दूसरे पक्ष के नुकसान, दावों या कानूनी लागतों को कवर करने की आवश्यकता हो सकती है।', 'अपने उल्लंघन के कारण होने वाले प्रत्यक्ष, सिद्ध नुकसान तक क्षतिपूर्ति को सीमित करने के लिए कानूनी सलाह लें।'],
          'Automatic renewal': ['स्वचालित नवीनीकरण', 'दस्तावेज़ समय सीमा से पहले नोटिस न दिए जाने पर स्वचालित रूप से नवीनीकृत हो सकता है।', 'कैलेंडर रिमाइंडर जोड़ें और स्पष्ट रद्दीकरण खिड़कियों पर बातचीत करें।'],
          'Non-compete restriction': ['गैर-प्रतिस्पर्धा प्रतिबंध', 'भविष्य के काम, ग्राहकों, भूगोल या व्यावसायिक गतिविधियों पर सीमाएं हो सकती हैं।', 'अवधि, क्षेत्र और प्रतिबंधित गतिविधियों को सीमित करें।'],
          'Unilateral termination': ['एकपक्षीय समाप्ति', 'एक पक्ष सीमित नोटिस या व्यापक विवेक के साथ समझौते को समाप्त करने में सक्षम हो सकता है।', 'पारस्परिक समाप्ति अधिकार और उचित सुधारात्मक अवधि का अनुरोध करें।'],
          'Confidentiality burden': ['गोपनीयता का बोझ', 'समझौता समाप्त होने के बाद भी गोपनीयता दायित्व जारी रह सकते हैं।', 'अस्तित्व अवधि और सलाहकारों को अनुमत खुलासे की पुष्टि करें।']
        };
        if (hindiMap[title]) {
          [localizedTitle, localizedExplanation, localizedSuggestion] = hindiMap[title];
        }
      } else if (language === 'Gujarati') {
        const gujaratiMap = {
          'Broad indemnity': ['વ્યાપક વળતર', 'ભાષા સૂચવે છે કે એક પક્ષે બીજા પક્ષ માટે નુકસાન, દાવા અથવા કાનૂની ખર્ચને આવરી લેવાની જરૂર પડી શકે છે.', 'કાનૂની સલાહકારને પૂછો કે તે વળતરને તમારા ભંગને કારણે થયેલા સીધા, સાબિત નુકસાન સુધી મર્યાદિત કરે.'],
          'Automatic renewal': ['સ્વચાલિત નવીકરણ', 'સમયમર્યાદા પહેલાં નોટિસ ન આપવામાં આવે તો દસ્તાવેજ આપમેળે નવેસરથી શરૂ થઈ શકે છે.', 'કેલેન્ડર રીમાઇન્ડર્સ ઉમેરો અને સ્પષ્ટ રદ્દીકરણ વિંડોઝની વાટાઘાટો કરો.'],
          'Non-compete restriction': ['બિન-સ્પર્ધાત્મક પ્રતિબંધ', 'ભવિષ્યના કામ, ગ્રાહકો, ભૂગોળ અથવા વ્યવસાયિક પ્રવૃત્તિઓ પર મર્યાદા હોઈ શકે છે.', 'સમયગાળો, પ્રદેશ અને પ્રતિબંધિત પ્રવૃત્તિઓને મર્યાદિત કરો.'],
          'Unilateral termination': ['એકપક્ષીય સમાપ્તિ', 'એક પક્ષ મર્યાદિત નોટિસ અથવા વ્યાપક વિવેકબુદ્ધિ સાથે કરાર સમાપ્ત કરવા સક્ષમ હોઈ શકે છે.', 'પરસ્પર સમાપ્તિ અધિકારો અને વાજબી ઉપચાર સમયગાળાની વિનંતી કરો.'],
          'Confidentiality burden': ['ગોપનીયતાનો બોજ', 'કરાર સમાપ્ત થયા પછી પણ ગોપનીયતાની જવાબદારીઓ ચાલુ રહી શકે છે.', 'અસ્તિત્વનો સમયગાળો અને સલાહકારોને મંજૂર કરાયેલ ખુલાસાઓની પુષ્ટિ કરો.']
        };
        if (gujaratiMap[title]) {
          [localizedTitle, localizedExplanation, localizedSuggestion] = gujaratiMap[title];
        }
      }

      return {
        title: localizedTitle,
        level,
        explanation: localizedExplanation,
        suggestion: localizedSuggestion,
        excerpt: sentences.find((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword))) || ''
      };
    });

  let clauses = [
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

  if (language === 'Hindi') {
    clauses = [
      {
        title: 'पक्ष और कार्यक्षेत्र',
        category: 'अवलोकन',
        explanation: 'यह पहचान करता है कि कौन शामिल है और यह दस्तावेज़ क्या नियंत्रित करने के लिए है।'
      },
      {
        title: 'कर्तव्य और प्रतिबंध',
        category: 'दायित्व',
        explanation: 'यह स्पष्ट करता है कि प्रत्येक पक्ष को क्या करना चाहिए, किस चीज़ से बचना चाहिए या क्या गोपनीय रखना चाहिए।'
      },
      {
        title: 'अवधि और समाप्ति अधिकार',
        category: 'समय सीमा',
        explanation: 'यह कवर करता है कि समझौता कब शुरू होता है, दायित्व कब तक चलते हैं, और यह कैसे समाप्त हो सकता है।'
      }
    ];
  } else if (language === 'Gujarati') {
    clauses = [
      {
        title: 'પક્ષકારો અને અવકાશ',
        category: 'વિહંગાવલોકન',
        explanation: 'તે ઓળખે છે કે કોણ સામેલ છે અને આ દસ્તાવેજ શું નિયંત્રિત કરવા માટે છે.'
      },
      {
        title: 'ફરજો અને નિયંત્રણો',
        category: 'જવાબદારીઓ',
        explanation: 'દરેક પક્ષે શું કરવું જોઈએ, શું ટાળવું જોઈએ અથવા શું ગોપનીય રાખવું જોઈએ તે સમજાવે છે.'
      },
      {
        title: 'સમયગાળો અને સમાપ્તિ અધિકારો',
        category: 'સમયમર્યાદા',
        explanation: 'સમજૂતી ક્યારે શરૂ થાય છે, જવાબદારીઓ ક્યાં સુધી ચાલે છે અને તે કેવી રીતે સમાપ્ત થઈ શકે છે તે આવરી લે છે.'
      }
    ];
  }

  let hiddenCharges = [
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

  if (language === 'Hindi') {
    hiddenCharges = [
      {
        title: 'विलंब शुल्क और ब्याज दंड',
        amount: '$50 फ्लैट शुल्क प्लस 1.5% मासिक चक्रवृद्धि ब्याज',
        explanation: '15-दिन की रियायत अवधि के बाद भुगतान न होने पर स्वचालित रूप से चक्रवृद्धि वित्त शुल्क और प्रशासनिक फ्लैट शुल्क लागू होते हैं।',
        excerpt: 'In addition to a $50 late administrative fee, interest on overdue amounts shall accrue at 1.5% per month.'
      },
      {
        title: 'जल्दी समाप्ति का दंड',
        amount: '3 महीने के आधार शुल्क के बराबर',
        explanation: 'बिना कारण अनुबंध को समय से पहले समाप्त करने पर तीन महीने के पूर्ण आधार शुल्क के बराबर गंभीर रद्दीकरण शुल्क लगता है।',
        excerpt: 'If Client terminates this agreement prior to the expiration of the Initial Term without cause, Client shall pay an early termination fee equal to three times the average monthly billing.'
      }
    ];
  } else if (language === 'Gujarati') {
    hiddenCharges = [
      {
        title: 'મોડી ચુકવણી ફી અને વ્યાજ દંડ',
        amount: '$50 ફ્લેટ ફી વત્તા 1.5% ચક્રવૃદ્ધિ વ્યાજ માસિક',
        explanation: '15-દિવસની ગ્રેસ પીરિયડ પછી મોડી ચૂકવણીઓ આપમેળે ચક્રવૃદ્ધિ ફાઇનાન્સ શુલ્ક અને વહીવટી ફ્લેટ ફી ટ્રિગર કરે છે.',
        excerpt: 'In addition to a $50 late administrative fee, interest on overdue amounts shall accrue at 1.5% per month.'
      },
      {
        title: 'વહેલી સમાપ્તિ દંડ',
        amount: '3 મહિનાની બેઝલાઇન ફી સમાન',
        explanation: 'કોઈ કારણ વિના કરારને વહેલો સમાપ્ત કરવાથી ત્રણ મહિનાના બેઝલાઇન ચાર્જ જેટલી ગંભીર કેન્સલેશન ફી લાગે છે.',
        excerpt: 'If Client terminates this agreement prior to the expiration of the Initial Term without cause, Client shall pay an early termination fee equal to three times the average monthly billing.'
      }
    ];
  }

  let documentOverview = 'This agreement establishes a formal business relationship between the parties. It defines the operational scopes, duration of service, payment schedules, and confidentiality clauses binding both parties.';
  let keyInformation = `• Parties: Client and Service Provider
• Effective Date: Upon signature
• Initial Term: 12 months with automatic renewal
• Governing Law: State law
• Payment terms: Net 30 days`;
  let fallbackSummary = 'This document defines legal obligations between parties. Review responsibilities, restrictions, deadlines, and liability before signing.';
  let fallbackSimplifiedText = 'In simple terms, this document sets rules for what each side can do, what each side must protect, and what may happen if someone breaks those rules.';

  if (language === 'Hindi') {
    documentOverview = 'यह समझौता पक्षों के बीच एक औपचारिक व्यावसायिक संबंध स्थापित करता है। यह परिचालन क्षेत्रों, सेवा की अवधि, भुगतान अनुसूचियों और दोनों पक्षों को बाध्य करने वाले गोपनीयता क्लॉज को परिभाषित करता है।';
    keyInformation = `• पक्ष: ग्राहक और सेवा प्रदाता
• प्रभावी तिथि: हस्ताक्षर पर
• प्रारंभिक अवधि: स्वचालित नवीनीकरण के साथ 12 महीने
• शासी कानून: राज्य कानून
• भुगतान की शर्तें: नेट 30 दिन`;
    fallbackSummary = 'यह दस्तावेज़ पक्षों के बीच कानूनी दायित्वों को परिभाषित करता है। समीक्षा करें और हस्ताक्षर करने से पहले समझें।';
    fallbackSimplifiedText = 'सरल शब्दों में, यह दस्तावेज़ नियम निर्धारित करता है कि दोनों पक्ष क्या कर सकते हैं और क्या नहीं कर सकते हैं।';
  } else if (language === 'Gujarati') {
    documentOverview = 'આ સમજૂતી પક્ષકારો વચ્ચે ઔપચારિક વ્યાવસાયિક સંબંધ સ્થાપિત કરે છે. તે ઓપરેશનલ ક્ષેત્રો, સેવાનો સમયગાળો, ચુકવણી સમયપત્રક અને બંને પક્ષોને બંધનકર્તા ગોપનીયતા કલમોને વ્યાખ્યાયિત કરે છે.';
    keyInformation = `• પક્ષકારો: ક્લાયન્ટ અને સર્વિસ પ્રોવાઇડર
• અસરકારક તારીખ: હસ્તાક્ષર પર
• પ્રારંભિક મુદત: સ્વચાલિત નવીકરણ સાથે 12 મહિના
• સંચાલક કાયદો: રાજ્યનો કાયદો
• ચુકવણીની શરતો: નેટ 30 દિવસ`;
    fallbackSummary = 'આ દસ્તાવેજ પક્ષકારો વચ્ચેની કાનૂની જવાબદારીઓને વ્યાખ્યાયિત કરે છે. સહી કરતા પહેલા તેની સમીક્ષા કરો.';
    fallbackSimplifiedText = 'સરળ શબ્દોમાં કહીએ તો, આ દસ્તાવેજ બંને પક્ષો શું કરી શકે અને શું ન કરી શકે તેના નિયમો નક્કી કરે છે.';
  }

  return {
    summary: sentences.slice(0, 3).join(' ') || fallbackSummary,
    simplifiedText: sentences.slice(0, 8).join(' ') || fallbackSimplifiedText,
    documentOverview,
    keyInformation,
    clauses,
    risks,
    hiddenCharges,
    provider: 'local-fallback',
    analyzedAt: new Date()
  };
}

function analysisPrompt(text, language = 'English') {
  return `
You are a legal document simplification assistant. This is not legal advice.
Analyze the document and generate all text values directly in ${language}.
Return only valid JSON with these keys:
summary: concise plain-${language} summary.
simplifiedText: simplified explanation of the document in plain ${language}.
documentOverview: brief paragraph summarizing the type, purpose, and scope of the document in ${language}.
keyInformation: bulleted list of key facts (e.g. Effective Date, Parties, Governing Law, Term, Payment Terms) in clear plain ${language}.
clauses: array of { "title", "category", "explanation" } where all keys and explanations are in ${language}.
risks: array of { "title", "level", "explanation", "suggestion", "excerpt" } where all texts are in ${language}, EXCEPT "level" which must remain strictly one of 'low', 'medium', or 'high', and "excerpt" which must match the exact language from the document context.
hiddenCharges: array of { "title", "amount", "explanation", "excerpt" } detailing any hidden costs, setup charges, penalties, or unusual fee obligations in ${language}, EXCEPT "excerpt" which must match the exact language from the document context.

Document:
${text.slice(0, 18000)}
`;
}

export async function analyzeLegalText(text, language = 'English') {
  const provider = process.env.AI_PROVIDER;

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: analysisPrompt(text, language) }],
      temperature: 0.2
    });
    return { ...extractJson(response.choices[0].message.content), provider: 'openai', analyzedAt: new Date() };
  }

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const response = await model.generateContent(analysisPrompt(text, language));
    return { ...extractJson(response.response.text()), provider: 'gemini', analyzedAt: new Date() };
  }

  return fallbackAnalysis(text, language);
}

export async function answerDocumentQuestion(document, question, language = 'English') {
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
        { role: 'system', content: `Answer in clear simple ${language} using only the provided document context. Mention uncertainty in ${language} when the document does not answer.` },
        { role: 'user', content: context }
      ],
      temperature: 0.2
    });
    return response.choices[0].message.content;
  }

  if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const response = await model.generateContent(`Answer simply from this document context in ${language}. If unsure, say so in ${language}.\n${context}`);
    return response.response.text();
  }

  // Local fallback: return the top chunk from vector search if it is relevant enough,
  // or fall back to keyword matching.
  if (topChunks && topChunks.length > 0) {
    if (language === 'Hindi') {
      return `दस्तावेज़ के आधार पर, संबंधित अनुभाग है: "${topChunks[0].text}"\n\nसरल शब्दों में, दस्तावेज़ के इस हिस्से की समीक्षा करें क्योंकि यह सीधे आपके प्रश्न का उत्तर देता है।`;
    }
    if (language === 'Gujarati') {
      return `દસ્તાવેજના આધારે, સંબંધિત વિભાગ આ છે: "${topChunks[0].text}"\n\nસરળ શબ્દોમાં, દસ્તાવેજના આ ભાગની સમીક્ષા કરો કારણ કે તે સીધા તમારા પ્રશ્નનો જવાબ આપે છે।`;
    }
    return `Based on the document, the relevant section is: "${topChunks[0].text}"\n\nIn simple terms, review this portion of the document as it directly addresses your question.`;
  }

  const lowerQuestion = question.toLowerCase();
  const relevantSentence = document.extractedText
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => lowerQuestion.split(/\W+/).filter((word) => word.length > 4).some((word) => sentence.toLowerCase().includes(word)));

  if (relevantSentence) {
    if (language === 'Hindi') {
      return `दस्तावेज़ के आधार पर, संबंधित भाषा प्रतीत होती है: "${relevantSentence}"\n\nसरल शब्दों में, इस क्लॉज की सावधानीपूर्वक समीक्षा करें क्योंकि यह आपके प्रश्न से जुड़े दायित्व, प्रतिबंध, समय सीमा या जोखिम को परिभाषित कर सकता है।`;
    }
    if (language === 'Gujarati') {
      return `દસ્તાવેજના આધારે, સંબંધિત ભાષા આ જણાય છે: "${relevantSentence}"\n\nસરળ શબ્દોમાં, આ કલમની કાળજીપૂર્વક સમીક્ષા કરો કારણ કે તે તમારા પ્રશ્ન સાથે જોડાયેલ જવાબદારી, પ્રતિબંધ, સમયમર્યાદા અથવા જોખમને વ્યાખ્યાયિત કરી શકે છે।`;
    }
    return `Based on the document, the relevant language appears to be: "${relevantSentence}" In simple terms, review this clause carefully because it may define an obligation, restriction, deadline, or risk tied to your question.`;
  }

  if (language === 'Hindi') {
    return 'मुझे निकाले गए टेक्स्ट में कोई सटीक उत्तर नहीं मिला। सबसे सुरक्षित अगला कदम सारांश और ध्वजांकित क्लॉज की समीक्षा करना है, फिर अधिक विशिष्ट शब्द या अनुभाग के बारे में पूछना है।';
  }
  if (language === 'Gujarati') {
    return 'મને કાઢવામાં આવેલા ટેક્સ્ટમાં ચોક્કસ જવાબ મળ્યો નથી। સૌથી સુરક્ષિત આગલું પગલું સારાંશ અને ફ્લેગ કરેલી કલમોની સમીક્ષા કરવાનું છે, પછી વધુ વિશિષ્ટ શબ્દ અથવા વિભાગ વિશે પૂછવું।';
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
