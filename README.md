# AI Legal Document Simplifier

A polished full-stack SaaS application for uploading legal documents, extracting text, simplifying legal language, detecting risk, generating summaries, and chatting with the document.

## Stack

- React + Vite + Tailwind CSS
- Node.js + Express
- MongoDB + Mongoose
- Supabase authentication
- Multer file uploads
- `pdf-parse` and `mammoth` document extraction
- OpenAI or Gemini integration with a local fallback analyzer for development

## Quick Start

```bash
npm install
copy server\.env.example server\.env
npm run dev
```

Client: `http://localhost:5173`

API: `http://localhost:5000`

## AI Providers

Set one of these in `server/.env`:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_key
```

or

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
```

Without a key, the backend uses a deterministic local fallback so the portfolio flow remains demoable.
Updating the functionalities:
Added the multilanguage model in the plateform