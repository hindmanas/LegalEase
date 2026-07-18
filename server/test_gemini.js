import 'dotenv/config';
import { analyzeLegalText, answerDocumentQuestion } from './src/services/ai.service.js';

async function runTests() {
  console.log("Starting programmatic tests...");
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

  const sampleDoc = {
    _id: "test-doc-id",
    user: "test-user-id",
    extractedText: "This Agreement is made on January 1, 2026, between Alpha Corp (Provider) and Beta Inc (Client). The services will be provided for 12 months. The Client shall pay $5,000 per month. Either party can terminate with 30 days notice.",
    analysis: {
      summary: "Service agreement between Alpha Corp and Beta Inc for 12 months at $5000/month."
    }
  };

  try {
    // 1. Test answerDocumentQuestion - Related Question
    console.log("\n--- Testing Document Related Question ('What is the monthly fee?') ---");
    const answer1 = await answerDocumentQuestion(sampleDoc, "What is the monthly fee?", "English");
    console.log("Response:", answer1);

    // 2. Test answerDocumentQuestion - Date/Day Question
    console.log("\n--- Testing Basic Question ('what is date today and what is the day today?') ---");
    const answer2 = await answerDocumentQuestion(sampleDoc, "what is date today and what is the day today?", "English");
    console.log("Response:", answer2);

    // 3. Test answerDocumentQuestion - Unrelated Question
    console.log("\n--- Testing Unrelated Question ('how to calculate bmi?') ---");
    const answer3 = await answerDocumentQuestion(sampleDoc, "how to calculate bmi?", "English");
    console.log("Response:", answer3);

    // 4. Test analyzeLegalText
    console.log("\n--- Testing analyzeLegalText ---");
    const analysis = await analyzeLegalText(sampleDoc.extractedText, "English");
    console.log("Analysis Provider:", analysis.provider);
    console.log("Analysis Keys:", Object.keys(analysis));
    console.log("Summary:", analysis.summary);

  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

runTests();
