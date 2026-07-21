import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testKey() {
  console.log("Checking GEMINI_API_KEY in .env...");
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY is not defined in .env");
    return;
  }
  console.log("Key length:", key.length);
  console.log("Key format check:", key.startsWith("AIzaSy") ? "Valid format (starts with AIzaSy)" : "Warning: Key does not start with AIzaSy");

  const genAI = new GoogleGenerativeAI(key);
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'];

  for (const modelName of models) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent("Hello, respond with one word: Success.");
      console.log(`[SUCCESS] ${modelName} responded: "${response.response.text().trim()}"`);
    } catch (err) {
      console.error(`[FAILED] ${modelName} failed with error:`, err.message);
    }
  }
}

testKey();

