# Expungo

**Empowering Justice Through AI-Driven Criminal Record Expungement**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.120-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 🎯 Problem Statement

**Over 70 million Americans have criminal records**, creating barriers to employment, housing, and education. Every state has expungement or record sealing laws that offer relief, but the process is complex, confusing, and often inaccessible to those who need it most. Traditional legal services are expensive, and navigating state-specific court forms and eligibility criteria without guidance is overwhelming.

**The challenge:** How can we democratize access to criminal record relief and make the expungement process accessible, affordable, and understandable for everyone across all 50 states?

---

## 💡 Our Solution

**Expungo** is an AI-powered platform that simplifies the expungement process across all 50 states through three key innovations:

1. **Intelligent Document Analysis**: Upload your RAP sheet (Record of Arrest and Prosecution) or court documents, and our Gemini-powered PDF parser automatically extracts case details, convictions, and dates.

2. **RAG-Based Eligibility Assessment**: Using Retrieval-Augmented Generation (RAG) with ChromaDB and LangChain, we analyze your specific case against state-specific statutes, court rules, and eligibility requirements across all 50 states to provide personalized guidance.

3. **Voice-Enabled AI Assistant**: Talk through your case with our LiveKit-powered conversational agent that understands legal terminology, asks clarifying questions, and provides step-by-step guidance in natural language.

**Result:** Transform a weeks-long, confusing legal process into a 15-minute guided experience.

---

## 🛠️ Tech Stack

### Backend Architecture (Microservices)

#### **Core API Service** (`/backend`)
- **FastAPI** - High-performance async Python web framework
- **Uvicorn** - ASGI server with uvloop for production-grade performance
- **Python-Multipart** - File upload handling for PDF processing
- **CORS Middleware** - Secure cross-origin resource sharing

#### **Intelligent PDF Processing**
- **PyPDF2** - PDF text extraction and manipulation
- **Google Gemini AI** - Advanced LLM for structured document parsing
  - Extracts case numbers, conviction dates, code sections, counties
  - Handles complex legal document formats and OCR'd documents
  - Structured output with retry logic and error handling

#### **RAG (Retrieval-Augmented Generation) System**
- **ChromaDB (v1.2.1)** - Vector database for semantic search over legal documents
  - Stores embeddings of expungement statutes for all 50 states
  - Enables similarity search for relevant legal precedents across jurisdictions
  - Persistent storage with HNSW indexing
- **LangChain** - RAG orchestration framework
  - Document chunking and preprocessing
  - Context-aware retrieval chains
  - Prompt engineering for legal domain
- **LangChain-OpenAI** - OpenAI embeddings integration
  - text-embedding-ada-002 for high-quality semantic vectors
  - GPT-4 for eligibility reasoning and natural language responses

#### **Real-Time Voice Agent** (`/voice-agent`)
- **LiveKit Agents SDK (v1.2)** - Production-ready voice AI framework
  - WebRTC-based real-time audio streaming
  - Built-in turn detection and voice activity detection (VAD)
  - Session management and conversation state
- **LiveKit Plugins**:
  - **Silero VAD** - Voice activity detection for natural conversations
  - **Turn Detector (Multilingual)** - Intelligent conversation turn-taking
  - **Noise Cancellation** - Audio quality enhancement
- **WebSockets (v12.0)** - Bidirectional real-time communication
- **PyJWT** - Secure token-based authentication for LiveKit sessions

#### **Supporting Services**
- **Python-Dotenv** - Environment variable management
- **Logging** - Structured logging with rotation and monitoring
- **Pydantic** - Data validation and settings management
- **HTTPX** - Async HTTP client for inter-service communication

### Frontend

- **Next.js 15** - React framework with server-side rendering and App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom design system
- **Shadcn/ui** - Accessible, customizable component library
- **React Hooks** - State management and side effects

### Data Layer

- **ChromaDB Vector Store**
  - Expungement statutes and penal codes for all 50 states
  - State-specific court procedures and form instructions
  - Eligibility criteria and case law references across jurisdictions
  - 960+ lines of legal knowledge base covering nationwide expungement laws

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.12 or higher)
- **npm** (v9 or higher)
- **API Keys**:
  - OpenAI API key (for embeddings and GPT-4)
  - Google Gemini API key (for PDF parsing)
  - LiveKit API credentials (for voice agent)

---

### 1️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (use legacy peer deps for compatibility)
npm install --legacy-peer-deps

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:3000**

---

### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Gemini Configuration  
GOOGLE_API_KEY=your_google_gemini_api_key_here

# ChromaDB Configuration (optional, uses local by default)
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

#### Initialize ChromaDB Vector Store

```bash
# Run the initialization script to populate ChromaDB with legal documents
python -m scripts.initialize_chromadb

# This will:
# - Create the ChromaDB collection
# - Load legal documents for all 50 states from backend/data/
# - Generate embeddings using OpenAI
# - Store vectors in backend/chroma_db/
```

#### Start the Backend Server

```bash
# Run with uvicorn (development)
uvicorn main:app --reload --port 8000

# The API will be available at: http://127.0.0.1:8000
# API Documentation: http://127.0.0.1:8000/docs
```

---

### 3️⃣ Voice Agent Setup (Optional)

```bash
# Navigate to voice-agent directory
cd voice-agent

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure LiveKit Environment Variables

Create a `.env.local` file in the `voice-agent/` directory:

```bash
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
OPENAI_API_KEY=your_openai_api_key
```

#### Start the Voice Agent

```bash
# Run the agent server
python src/agent.py start
```

## 🎨 Features

- ✅ **PDF Upload & Parsing** - Automatic extraction of case details from RAP sheets
- ✅ **RAG-Powered Eligibility Analysis** - Context-aware legal reasoning
- ✅ **Voice Conversational Interface** - Natural language guidance
- ✅ **Multi-Step Form** - Intuitive user experience
- ✅ **Responsive Design** - Mobile-first UI with Tailwind CSS
- ✅ **Real-Time Audio Processing** - LiveKit WebRTC integration
- ✅ **Vector Semantic Search** - ChromaDB similarity matching
- ✅ **Production-Ready API** - FastAPI with async support

---

## 🔒 Security & Privacy

- All documents are processed in-memory and not permanently stored
- API keys secured via environment variables
- CORS configured for trusted origins only
- Voice sessions use JWT-based authentication
- ChromaDB runs locally to protect sensitive legal data

---

## 🤝 Contributing

This project was built for Cal Hacks. We welcome feedback and contributions!

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ by the Expungo team at Cal Hacks 2025

---

## 🙏 Acknowledgments

- State court systems and legal aid organizations nationwide
- OpenAI for GPT-4 and embeddings
- Google for Gemini AI
- LiveKit for voice infrastructure
- LangChain community for RAG patterns

---

**Making justice accessible, one expungement at a time.** ⚖️
