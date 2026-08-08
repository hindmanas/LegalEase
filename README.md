# ⚖️ LegalEase AI

> **Understand your legal documents before you sign them.**

LegalEase AI is an AI-powered legal document analysis platform designed to help users understand complex legal documents in simple language.

It analyzes uploaded legal documents, identifies important clauses and potential risks, maps relevant Acts, Laws and Sections, and allows users to ask questions based specifically on their uploaded document.

🔗 **Live Demo:** https://legal-ease-client-cyan.vercel.app/

---

## 🚀 Why LegalEase?

Legal documents can be difficult to understand because of complex terminology, lengthy clauses, and legal language.

Imagine having a contract that you need to sign within a limited amount of time. Instead of manually going through every clause or sharing a sensitive document with a general-purpose AI tool, LegalEase provides a dedicated environment for analyzing legal documents.

The goal is simple:

> **Upload → Analyze → Understand → Ask Questions → Make Better Decisions**

---

## ✨ Key Features

### 📄 AI Document Analysis
Upload a legal document and receive an AI-powered analysis covering important clauses, key terms, and potential concerns.

### ⚠️ Risk Detection
Identifies potentially risky or unusual clauses and categorizes their importance to help users focus on critical parts of a document.

### ⚖️ Acts, Laws & Sections
Shows relevant legal Acts, Laws, Rules and Sections associated with the uploaded document, along with:
- Act / Law name
- Relevant Section
- Why it applies
- Confidence indicator

### 💬 Document-Based AI Chat
Ask questions about your uploaded document and receive answers based on the document's content rather than general-purpose answers.

### 🔎 Semantic Search
Uses embeddings and semantic similarity to retrieve the most relevant sections of a document before generating an answer.

### 📊 Analysis Report
Generate a structured report containing important findings from the document.

### 🌐 Multi-Language Support
The application supports multiple languages for a more accessible user experience.

### 🔐 Privacy-Focused
LegalEase is designed with document privacy in mind. Uploaded documents are processed for the requested analysis and are not intended to be used for training AI models.

### 🛠️ Tech Stack

| Category | Technologies | Purpose |
|---|---|---|
| **Frontend** | React.js, Vite | Build the web application interface |
| **Styling** | Tailwind CSS, CSS | Responsive and modern UI |
| **Routing** | React Router | Client-side navigation |
| **Animations** | Framer Motion | UI animations and transitions |
| **Backend** | Node.js, Express.js | REST APIs and server-side logic |
| **Authentication** | Supabase Auth | Email authentication and Google OAuth |
| **Database** | MongoDB, MongoDB Atlas | Store application data, documents, chunks|
| **File Storage** | Supabase Storage | Store uploaded legal documents |
| **AI** | Groq API | Legal document analysis and AI responses |
| **Models** | Groq API | Llama 3.3 70B, Groq Llama 3.3 70B, Groq Llama 3.3 70B-Thinking |
| **Embeddings** | Groq API | Generate vector representations of document content |
| **RAG** | Custom RAG Pipeline | Retrieve relevant document context for AI responses |
| **Semantic Search** | Cosine Similarity | Find relevant sections of uploaded documents |
| **Document Processing** | PDF/DOCX Text Extraction | Extract text from uploaded documents |
| **Internationalization** | i18next | Multi-language support |
| **Security** | Helmet, CORS | API security and cross-origin protection |
| **Deployment** | Vercel, Render | Frontend and backend deployment |
| **Version Control** | Git, GitHub | Source code management |



---

## 🧠 How It Works

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       (Vite)        │
                    └──────────┬──────────┘
                               │
                         Upload Document
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Express API      │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
          Supabase         Document       MongoDB
           Storage         Processing      Database
                │              │
                │              ▼
                │       Text Extraction
                │              │
                │              ▼
                │         Text Chunking
                │              │
                │              ▼
                │         Embeddings
                │              │
                │              ▼
                └──────► MongoDB
                               │
                               ▼
                       AI Analysis / RAG
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
            Risk Detection  Legal Mapping  AI Chat
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                       Analysis Results
                               │
                               ▼
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │  Dashboard / Report │
                    └─────────────────────┘


