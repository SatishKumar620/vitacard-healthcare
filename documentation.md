# VitaCard Healthcare Platform: Technical Blueprint & Architecture Documentation

**Author:** Satish Kumar  
**Version:** 1.0.0 (Production-ready)  
**Date:** June 22, 2026  
**Target Audience:** Engineering Leadership, Senior Architects, and Project Stakeholders  

---

## Executive Summary

The VitaCard Healthcare Platform is an automated, intelligent private healthcare membership portal. Operating on a subscription model starting at £9.99/month, it provides members with direct access to private medical practitioners, including GPs, dentists, therapists, and mental health specialists, along with up to 20% savings on consultations. 

The technical architecture is built on a modern decoupling of UI presentation, backend gateway proxying, database-native vector indexing, and low-code workflow automation. The platform features an AI-driven triage chatbot, Hindi/English speech synthesis and translation, client-side OCR report parsing, dual-role user dashboards, and transactional email notification flows.

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Project Objectives](#2-project-objectives)
3. [System Architecture](#3-system-architecture)
4. [Core Features](#4-core-features)
5. [System Workflow](#5-system-workflow)
6. [n8n Automation & RAG Matching](#6-n8n-automation--rag-matching)
7. [Security Considerations](#7-security-considerations)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Limitations & Future Scope](#9-limitations--future-scope)
10. [Conclusion](#10-conclusion)

---

## 1. Introduction

Primary healthcare systems face global bottlenecks, characterized by prolonged wait times in public systems (such as the NHS) and significant search friction when patients attempt to find specialized private care. Additionally, the lack of digital tools leaves clinics dealing with high administrative overhead.

VitaCard addresses these challenges through a subscription-based private healthcare membership model. The platform is designed to:
1. **Reduce Triage Friction:** Replace traditional search bars with an empathetic, multi-turn AI chatbot that collects patient history (anamnesis) before matching.
2. **Lower Private GP Access Costs:** Implement a member-only discount framework integrated into scheduling portals.
3. **Automate Clinic Operations:** Seamlessly link booking events to clinician queues and trigger transactional notifications, minimizing manually managed check-ins.

---

## 2. Project Objectives

From an architectural and product perspective, the development of VitaCard is guided by the following objectives:
* **Vector-native Matchmaking:** Leverage high-dimensional semantic search over clinician bios (using cosine distance) instead of relying on fragile keyword matches.
* **Bilingual Accessibility:** Provide voice and text localization for English and Hindi speakers, utilizing neural TTS models to bridge literacy barriers.
* **Client-Side Offloading:** Execute OCR processing client-side in the browser, saving server resources and ensuring patient privacy.
* **stateless Deployment:** Standardize the platform into a single Docker image containing the web gateway, database, and workflow engines to enable rapid scaling.
* **Transactional Reliability:** Ensure atomic operations for bookings, automatically updating patient records and triggering email dispatchers via Resend APIs.

---

## 3. System Architecture

The VitaCard system is designed with three distinct architectural layers to isolate presentation, integration, and database operations.

![System Architecture Blueprint](./system_architecture.png)

### 3.1 Presentation Layer (Frontend)
Built using **React 19** and **Vite 8**, the frontend uses standard CSS for custom glassmorphism, responsive CSS grids, and interactive 3D WebGL canvasses (React Three Fiber/Three.js) to deliver a premium user experience.
* **Client-Side Storage:** User session parameters, dashboards, and booking lists are managed in `localStorage` to allow stateless execution in testing environments.
* **OCR Processor:** Uses `Tesseract.js` directly within the browser thread to parse uploaded image documents (PNG/JPG) without transmitting raw image data to external servers.

### 3.2 Gateway & Proxy Layer (Backend Server)
An **Express.js** web server serves as the entry point for container traffic, listening on port 7860.
* **Static File Serving:** Serves the compiled React assets (from `/frontend-assets`).
* **Reverse Proxy:** Proxies `/n8n/*`, `/webhook/*`, `/rest/*`, and `/static/*` requests to the internal n8n service, insulating administration routes.
* **Speech & Translation Gateway:** Exposes custom REST endpoints (`/api/audio-to-text` and `/webhook/doctor-chat`) to handle speech recognition (STT) and translation using **Sarvam AI** APIs.

### 3.3 Data & Intelligence Layer (n8n & PostgreSQL)
* **n8n Automation Engine:** An internal, headless instance of n8n orchestrates patient sessions, triggers database inserts/updates, calls external LLM models (Cohere, Groq), and formats responses.
* **PostgreSQL Database:** A PostgreSQL 15 instance equipped with the **pgvector** extension. It hosts clinician records, embeds high-dimensional vector representations of doctor bios, and handles cosine similarity searches.

---

## 4. Core Features

### 4.1 Multi-Turn Conversational Triage
The triage interface is designed with a responsive panel that scales to 75% of the viewport on desktop. The chatbot uses a Llama-3.3-70b model (via Groq) to collect symptom duration, severity, location preferences, and urgency before querying the database.

### 4.2 Client-side OCR Report Parser
Patients can upload a diagnostics report image. The frontend extracts text using Tesseract.js in a background worker, displays a scanning status animation, and passes the extracted report string directly to the chatbot session. This bypasses the clarification questions and initiates an immediate semantic doctor search.

### 4.3 Sarvam AI Voice & Translation Router
The gateway manages multi-language translation and voice synthesis:
1. **Language Detection:** Detects Hindi (Devanagari) inputs.
2. **Translation Gateway:** Translates Hindi text to English using Sarvam's formal `mayura:v1` model for vector database queries.
3. **Synthesis Engine:** Translates English chatbot replies back to Hindi, appending report summaries, and synthesizes speech using Sarvam's `bulbul:v3` voice model (`shubh` speaker), returning a playable base64 audio payload to the frontend.

### 4.4 Dual-Role Dashboards
* **Patient Panel:** Includes an interactive calendar, diagnostic reports tracker, active notifications, and a simulated NFC digital membership card.
* **Doctor Panel:** Tracks the patient booking queue, displays EHR records, allows writing consultation notes, and provides scheduling controls.

### 4.5 Resend Email Integration
When a booking is finalized, the system issues a POST call to the Express backend. If configured, the backend calls the Resend REST API to dispatch transactional HTML emails to the patient and the doctor. Otherwise, it logs a formatted email transcript locally to `sent_emails.txt`.

---

## 5. System Workflow

The step-by-step data execution sequence is structured as follows:

```
[Patient UI] 
     │  (1) Inputs symptom text or uploads lab report image
     ▼
[Express Server Proxy]
     │  (2) Sanitizes input; translates Hindi to English (Sarvam AI)
     ▼
[n8n Automation Webhook]
     │  (3) Checks database for active session
     ├───────> (New Session) ──> Create record in postgres (chat_sessions)
     └───────> (Existing)   ──> Load message logs (session_messages)
     │
     ▼
[Session Logic Node]
     ├───────> (Data Incomplete) ──> Call Groq (Llama-3.3-70b) -> Return clarifying Q
     └───────> (Data Complete)   ──> Call Cohere (embed-english-v3.0) -> Generate 1024-dim vector
                                              │
                                              ▼
                                     [PostgreSQL pgvector Query]
                                     Perform L2 distance calculation: 
                                     SELECT id, bio, embedding <=> :vector AS score
                                              │
                                              ▼
                                     [Reranker Node (Groq LLM)]
                                     Evaluates top 5 profiles -> Selects best clinician
                                              │
                                              ▼
                                     [Respond Node]
                                     Returns doctor details card & synthesized voice stream (Sarvam TTS)
```

---

## 6. n8n Automation & RAG Matching

The backend RAG (Retrieval-Augmented Generation) pipeline is built entirely inside the n8n integration engine. 

### 6.1 Database Schema
The database requires three tables to manage vector matching and session memory:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Clinicians table with vector indexing
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    specialization VARCHAR(100),
    experience_years INT,
    location VARCHAR(100),
    languages TEXT[],
    availability VARCHAR(100),
    rating NUMERIC(3,2),
    fee_range VARCHAR(50),
    bio TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    hospital_name VARCHAR(150),
    profile_image_url TEXT,
    embedding vector(1024)
);

CREATE INDEX ON doctors USING hnsw (embedding vector_l2_ops);

-- Active chatbot triage sessions
CREATE TABLE chat_sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    original_query TEXT,
    questions_asked JSONB DEFAULT '[]'::jsonb,
    answers_collected JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'questioning',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Message logs for session context
CREATE TABLE session_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) REFERENCES chat_sessions(session_id),
    role VARCHAR(10) CHECK (role IN ('user', 'bot')),
    content TEXT,
    turn_number INT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Semantic Search Query
Inside the `pgvector Semantic Search` node, the vector representation generated by Cohere is compared against Doctor embeddings:
```sql
SELECT 
  d.id, d.name, d.specialization, d.experience_years, d.location, 
  d.languages, d.rating, d.fee_range, d.bio, d.hospital_name,
  1 - (d.embedding <=> '{{ $json.embeddingStr }}'::vector) AS similarity_score
FROM doctors d
WHERE d.embedding IS NOT NULL
ORDER BY d.embedding <=> '{{ $json.embeddingStr }}'::vector
LIMIT 5;
```

---

## 7. Security Considerations

* **Decoupled API Key Architecture:** The codebase uses `process.env` lookups. Secrets are injected at container startup and excluded from git via `.gitignore`.
* **SQL Injection Countermeasures:** All database queries within n8n workflows use parameterized variables (e.g., `'{{ $json.session_id }}'`), preventing SQL injection from user chat inputs.
* **CORS and Routing Insulation:** The Express proxy isolates ports. External traffic has access only to port 7860. The database port (5432) and the n8n editor port (5678) are restricted to the local network loopback (`127.0.0.1`).
* **Sandbox Data Isolation:** LocalStorage is utilized for patient histories and booking schedules. This ensures data is isolated to the client browser session.

---

## 8. Deployment Architecture

VitaCard is packaged into a single Docker container. This allows the frontend gateway, the n8n engine, and the PostgreSQL database to run as local microservices in a single isolated sandbox.

```
                  Public HTTP Traffic (Port 7860)
                               │
                               ▼
               ┌───────────────────────────────┐
               │    Express.js Proxy Server    │
               │   (Serves React / API Routes) │
               └──────┬─────────────────┬──────┘
                      │                 │
           Internal Reverse Proxy       │ Internal Loopback API Calls
           to /n8n (Port 5678)          ▼ (Port 5678/webhook)
               ┌──────┴──────┐   ┌──────────────┐
               │ n8n Engine  │──>│ PostgreSQL   │ (Port 5432)
               │ (Workflows) │   │ (pgvector)   │
               └─────────────┘   └──────────────┘
```

### 8.1 Dockerfile Configuration
The container uses `node:20-bookworm` to install node requirements, n8n globally, and the PostgreSQL 15 server alongside `postgresql-15-pgvector`.
```dockerfile
FROM node:20-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
      gnupg2 curl ca-certificates sudo \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
       | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
       > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      postgresql-15 postgresql-15-pgvector postgresql-client-15 \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g n8n
WORKDIR /app
COPY deploy/deploy-package.json ./package.json
RUN npm install --only=production
COPY . .
RUN chmod +x deploy/start.sh
USER 1000
EXPOSE 7860
CMD ["./deploy/start.sh"]
```

### 8.2 Startup Orchestration (`start.sh`)
When the container starts:
1. PostgreSQL is initialized in `/data/pgdata` and started.
2. The database `vitacard_db` is created, schema `init_schema.sql` is applied, and `seed_doctors.js` is executed.
3. n8n is started in the background. The script waits for it to boot and registers an admin owner account using REST calls.
4. Cohere and Groq credentials are added to the n8n database via API calls.
5. The `doctor_rag_workflow.json` workflow file is patched with the credentials IDs and imported via the n8n CLI.
6. The Express server is booted on port 7860 to handle routing and start serving static files.

---

## 9. Limitations & Future Scope

### 9.1 Container Recyclability & Persistence
Because Hugging Face Spaces are stateless, restarts rebuild the container image. This clears the local database state.
* **Future Scope:** Migrate the PostgreSQL container configuration to external managed database instances (e.g., Supabase or Neon DB) using SSL connections.

### 9.2 Token-based Authentication
The current system uses simulated login roles cached inside browser memory.
* **Future Scope:** Integrate Firebase Auth or Auth0 to enforce JWT verification, secure API route headers, and enable true HIPAA-compliant patient-doctor EHR data separation.

### 9.3 Payment Gateway Integration
Bookings are currently logged without verification.
* **Future Scope:** Integrate Stripe or Razorpay APIs to handle monthly subscription models, manage membership tiers, and issue active NFC membership cards.

---

## 10. Conclusion

The VitaCard Healthcare Platform demonstrates a robust approach to modern digital healthcare triage. By utilizing a hybrid model of Express proxy routing, pgvector database-level similarity calculations, and n8n automation graphs, the platform shows how low-code workflows can be combined with custom AI features to create a secure, scalable, and responsive patient experience.
