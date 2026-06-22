---
title: VitaCard
emoji: 🧡
colorFrom: red
colorTo: yellow
sdk: docker
pinned: false
app_port: 7860
---

# VitaCard Healthcare Platform

An Intelligent, Automated Private Healthcare Membership Platform combining React frontend dashboards, Express gateway proxying, n8n workflow orchestration, and PostgreSQL semantic vector search.

![System Architecture](./system_architecture.png)

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Project Objectives](#2-project-objectives)
3. [System Architecture](#3-system-architecture)
4. [Core Features](#4-core-features)
5. [System Workflow](#5-system-workflow)
6. [n8n Automation & RAG](#6-n8n-automation--rag)
7. [Security Considerations](#7-security-considerations)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Limitations & Future Scope](#9-limitations--future-scope)
10. [Conclusion](#10-conclusion)

---

## 1. Introduction

Modern primary healthcare systems face significant challenges: long administrative delays, difficulties in finding the right medical specialist, and high costs or wait times for private care. VitaCard addresses these issues with an affordable subscription-based private healthcare membership starting at £9.99/month. Members receive up to 20% off consultations with private GPs, dentists, physical therapists, and mental wellness practitioners.

By automating patient triage and doctor discovery with artificial intelligence, VitaCard provides a low-latency, intuitive, and highly personalized digital telehealth portal.

---

## 2. Project Objectives

The primary engineering and operational objectives of the platform are:
* **High-Dimensional Matchmaking:** Use PostgreSQL `pgvector` semantic search on clinician bios instead of static keyword queries to map symptoms to specialized doctors.
* **Low-latency Anamnesis Harvest:** Implement a conversational chatbot loop to gather vital patient context (symptoms, duration, urgency) prior to matching.
* **Bilingual Accessibility:** Provide speech-to-text, text-to-speech, and translations for English and Hindi users using Sarvam AI APIs.
* **Decoupled Document Processing:** Use `Tesseract.js` client-side to parse diagnostics lab reports (OCR) instantly in the browser.
* **Automated Confirmations:** Trigger transactional notification emails (via Resend API) to both doctor and patient upon scheduling.

### 2.1 5-Week Implementation Roadmap (GSoC-Style)

The development of the VitaCard platform is structured into a fast-paced 5-week lifecycle with distinct deliverables for each phase:

* **Week 1: Core Triage and Data Engine Foundation**
  - **Focus:** Infrastructure and Database Setup.
  - **Deliverables:** PostgreSQL 15 database schema initialization, HNSW index configurations for `pgvector` operations, and custom JS script seeding. Setup n8n server configurations, webhook listeners, and SQLite persistence. Build chat session tracking tables (`chat_sessions`, `session_messages`).
* **Week 2: AI Dialog Engine & RAG Matching Pipeline**
  - **Focus:** Search Vectorization & Conversational Workflows.
  - **Deliverables:** Link Cohere 1024-dimensional English embeddings nodes inside the matching graph. Implement parameterized cosine distance query logic. Integrate Groq's Llama-3.3-70b Chat Completion nodes to run multi-turn clarifying anamnesis harvesting and final match reranking.
* **Week 3: Frontend UI & Scheduling Calendars**
  - **Focus:** Dashboards and Booking Operations.
  - **Deliverables:** Implement the responsive, glassmorphic React 19 UI. Build separate patient EHR cards and doctor appointment list dashboards. Build interactive booking, rescheduling, and cancellation handler utilities syncing with client-side triggers. Add custom Three.js WebGL backgrounds.
* **Week 4: Client-Side OCR & Server-Side Security**
  - **Focus:** Document Parsing & JWT Authorization.
  - **Deliverables:** Integrate `Tesseract.js` client-side parsing inside background worker threads. Write zero-dependency backend JWT utilities using Node's native `crypto` package. Implement `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, and `/api/auth/update-profile` endpoints with token bearer header verifications.
* **Week 5: Notifications, Containerization & Space Deploy**
  - **Focus:** Transactional Communications & Container Orchestration.
  - **Deliverables:** Expose Resend HTML transactional email notification APIs on Express (falling back to local transcripts logging). Build the final Dockerfile setting up Node and Postgres runtime environments. Write `start.sh` startup automation scripts. Deploy and verify on Hugging Face Spaces.

---

## 3. System Architecture

The VitaCard codebase is divided into three logical layers:
1. **User Interface (React 19 & Vite 8):** Renders glassmorphic dashboards, 3D Three.js background canvasses, scheduling calendar modules, and the main audio/text chatbot.
2. **Gateway & Proxy (Express.js):** Acts as the public portal. Serves static frontend files and exposes APIs to transcode audio, translate speech inputs, and route n8n webhooks.
3. **Data & AI Layer (PostgreSQL with pgvector, n8n, LLMs):** n8n orchestrates workflows, postgres manages doctor data, Groq (Llama-3.3-70b) runs LLM tasks, and Cohere generates embeddings.

### 3.1 Codebase Structure & File Purpose

Below is the directory mapping of the VitaCard project, summarizing the functional role of each critical source file:

```
medical-bot/
├── deploy/
│   ├── Dockerfile                   # Configures the Node.js/PostgreSQL container runtime
│   ├── start.sh                     # Orchestrates database creation, seeding, n8n webhook registration, and boots Express
│   ├── deploy-package.json          # Container-only production dependency manifest
│   ├── deploy-readme.md             # Readme instructions tailored for Hugging Face Space deployments
│   ├── init_schema.sql              # SQL script detailing the doctors, chat_sessions, and session_messages tables
│   ├── seed_doctors.js              # Node database seeder populating doctor records with vectors
│   └── doctor_rag_workflow.json     # Declarative n8n workflow configuration representing matching routes
├── scripts/                         # Contains localized system utility, verification, and testing shell scripts
│   ├── check_err.py                 # Error diagnostics helper
│   ├── seed_postgres.py             # Backup database populator
│   └── test-*.sh                    # Integrations scripts for webhooks, active sessions, and n8n responses
├── src/                             # Front-end codebase root
│   ├── db/
│   │   └── doctors.json             # Local database of doctors used in client search fallbacks
│   ├── utils/
│   │   └── state.js                 # LocalStorage synchronizer, state emitters, and JWT API controllers
│   ├── components/
│   │   ├── Navbar.jsx               # Header navigation panel managing notifications and sessions
│   │   ├── Hero.jsx                 # Site landing banner promoting memberships and registrations
│   │   ├── Services.jsx             # Informational cards outlining clinic fields
│   │   ├── DoctorsList.jsx          # Directory query list with booking modal triggers
│   │   ├── DoctorDetails.jsx        # Practitioner profiles presenting bio descriptions and available slots
│   │   ├── Chat.jsx                 # AI triage chatbot overlay handling dialog bubbles and quick replies
│   │   ├── Login.jsx                # Multi-role authentication entry page
│   │   ├── Signup.jsx               # Demographic fields input forms for patients and clinicians
│   │   └── Dashboard.jsx            # Multi-panel dashboards rendering patients EHR/reports and doctor calendars
│   ├── App.jsx                      # Main routing controller resolving hash addresses (#/login, #/dashboard)
│   ├── main.jsx                     # Core application mounting node
│   ├── index.css                    # Design system tokens and styling rules
│   └── dashboard.css                # Layout rules styling patient/practitioner dashboard screens
├── server.js                        # Express.js web server handling routing, proxying, and custom JWT auth
├── package.json                     # Main node workspace specifications and dependencies
├── vite.config.js                   # Packaging bundler parameters with API proxy setups
└── documentation.md                 # Deep technical blueprint and documentation
```

### 3.2 Dependencies and Library Matrix

The platform integrates third-party modules across frontend, backend, and workflow automation layers:

#### 3.2.1 Frontend (React Application)
* **`react` / `react-dom` (v19):** UI rendering framework.
* **`three` (v0.184.0) / `@react-three/fiber` (v9.6.1) / `@react-three/drei` (v10.7.7):** Renders the premium 3D glassmorphic WebGL particle effect in the background of the landing pages.
* **`tesseract.js` (v7.0.0):** Browser-side OCR parser inside background workers.
* **`vite` (v8.0.12):** Packaging tool with API proxy configurations.

#### 3.2.2 Backend Server & Container Gateway
* **`express` (v4.18.2):** Web application framework.
* **`http-proxy-middleware` (v2.0.6):** Forwarding server proxy middleware.
* **`crypto` (Node.js Native):** Custom stateless JWT authentication utilities.
* **`fs` / `path` (Node.js Native):** Manages local persistence for registered accounts inside `users.json`.

#### 3.2.3 Automation & Database Layer
* **`n8n` (v1.0+):** Graphical workflow engine executing the triage graph, dialog memories, and LLM integrations.
* **`pg` / `pgvector` (PostgreSQL 15 extension):** Vector distance calculations.

### 3.3 Express API Endpoints Registry

The Express gateway exposes the following REST endpoints to drive user authentication, notification events, and communication scripts:

1. **`POST /api/auth/signup`** - Registers new patient or doctor accounts, writes credentials to `users.json`, and returns an HS256 JWT.
2. **`POST /api/auth/login`** - Authenticates users role, email, and password, and returns a signed session token.
3. **`GET /api/auth/me`** - Validates the request Bearer header token and resolves active user credentials.
4. **`POST /api/auth/update-profile`** - Validates user session, merges submitted profile edits with local database records, and updates the state.
5. **`POST /api/send-appointment-email`** - Fires Resend HTML template dispatchers to both patient and doctor schedules.
6. **`POST /api/audio-to-text`** - Gateway transcoder route forwarding audio queries to Sarvam AI.
7. **`POST /webhook/doctor-chat`** - Relays text messages to the internal n8n service on port 5678.
8. **`/n8n/*`, `/webhook/*`, `/rest/*`, `/static/*`** - Proxies administration interfaces and active webhook endpoints directly to n8n.

---

## 4. Core Features

* **Conversational AI Triage:** A session-based chatbot window that dynamically questions users to narrow down their medical concerns.
* **Client-side OCR Reader:** Extract text from medical report uploads using Tesseract.js, immediately feeding extracted data into the active chatbot triage.
* **Sarvam AI Voice Engine:** Custom endpoints handle base64 audio translation (Hindi to English) and text-to-speech rendering for natural-sounding Hindi/English voice outputs.
* **Bilingual Translation Routing:** Fully localizes matches, medical advice, and question cards into Hindi.
* **EHR Patient & Doctor Portals:** Patient dashboard displays medical history files and appointment details; Doctor portal provides a patient queue tracker and EHR editor.
* **Resend Email System:** Automated notification endpoint dispatches confirmations containing date, time, specialization, and clinic details to both parties.

---

## 5. System Workflow

The user journey proceeds as follows:
```
[User Login] ──> [Animated Welcome Toast (5s)] 
                     │
                     ▼
[AI Medical Chat] <──> [Upload Lab Report (Optional Tesseract.js OCR)]
                     │
                     ▼
[n8n Clarification Loop] (Asks 2-3 targeted questions via Groq LLM)
                     │
                     ▼
[Semantic Vector Search] (Cohere Embeddings -> PostgreSQL pgvector Match)
                     │
                     ▼
[Reranking & Selection] (Groq ranks -> returns best matches as React Card)
                     │
                     ▼
[Clinic Booking] ──> [Save to LocalState & Trigger /api/send-appointment-email]
                     │
                     ▼
[Resend Notification] (Dispatches HTML confirmations to Patient & Doctor)
```

---

## 6. n8n Automation & RAG

The automated matchmaking logic is driven by n8n. The flow is defined inside `doctor_rag_workflow.json` and consists of the following 25 integrated execution nodes:

1. **`webhook` (HTTP Webhook):** Entry point. Listens for incoming `POST` messages forwarded from the Express gateway on `/webhook/doctor-chat`.
2. **`Parse Input` (JavaScript Code):** Extracts incoming variables, including the raw query string, active `session_id`, language context, and file upload state flags.
3. **`Is New Session?` (If Condition):** Evaluates if a matching `session_id` exists. Routes to database initialization if missing, else resumes diagnostic loops.
4. **`Create Session in DB` (PostgreSQL):** Inserts a new session record into the `chat_sessions` table for fresh users.
5. **`Load Existing Session` (PostgreSQL):** Queries the database to retrieve historical message parameters and state flags for returning sessions.
6. **`Merge Session Data` (JavaScript Code):** Normalizes and aggregates database variables and sets up n8n execution parameters.
7. **`Save User Message` (PostgreSQL):** Logs the patient's incoming chat message in the `session_messages` historical table.
8. **`Session Flow Logic` (JavaScript Code):** Evaluates dialogue progress, counts active conversational turns, tracks symptoms, and determines if the triage limit is met or if a semantic search is required.
9. **`Route: Search or Question?` (Switch Route):** Branches execution flow. Directs control to semantic search query lines, or forks to clarifying question generators.
10. **`Build Question Prompt` (JavaScript Code):** Aggregates the symptom profile, language context, and previous bot questions to construct the prompt payload for the generator.
11. **`Groq - Generate Question` (Groq API):** Calls Groq's Llama-3.3-70b Chat Completion model to synthesize a contextually logical, conversational triage question.
12. **`Extract Question Text` (JavaScript Code):** Parses the raw response text from the Groq API payload.
13. **`Save Question to DB` (PostgreSQL):** Logs the new bot question under `chat_sessions` memories and saves the dialogue string to the history database.
14. **`Format Question Response` (JavaScript Code):** Packages the question output with visual indicators, including progress card values and language badges.
15. **`Build Search Context` (JavaScript Code):** Aggregates all patient query turns and clinical statements into a single dense summary block, optimized for semantic embedding.
16. **`Update Status to Searching` (PostgreSQL):** Flags the session status as `searching` in the `chat_sessions` table.
17. **`Cohere - Generate Embedding` (Cohere API):** Dispatches the dense summary string to Cohere's `embed-english-v3.0` API, yielding a 1024-dimensional floating-point vector.
18. **`Extract Embedding Vector` (JavaScript Code):** Resolves the floating-point array from the Cohere response and serializes it for database lookup queries.
19. **`pgvector Semantic Search` (PostgreSQL):** Runs L2 distance similarity math (`<=>`) on the `doctors` database table using the 1024-dimensional query vector, returning the top 5 matches.
20. **`Process Search Results` (JavaScript Code):** Filters, cleans, and serializes the list of matching clinician records into a structured JSON string.
21. **`Groq - Rank & Select Doctor` (Groq API):** Prompts Llama-3.3-70b with the parsed diagnostics summary and candidate profiles, selecting the single best practitioner match and constructing clinical reasoning metrics.
22. **`Build Doctor Card` (JavaScript Code):** Packages the chosen clinician's details, likeness scores, location records, and AI reasoning parameters into a custom output card.
23. **`Save Result to DB` (PostgreSQL):** Stores the final selection payload, updates the session status as `completed`, and records the response to historical message tables.
24. **`Respond with Question` (HTTP Response):** Dispatches the clarifying question card directly back to the active user's webhook request stream.
25. **`Respond with Doctor Card` (HTTP Response):** Dispatches the finalized doctor card match details and AI reasoning back to the user's chat screen.

---

## 7. Security Considerations

* **Server-side JWT Authentication:** Stateless JSON Web Token authentication using Node's native `crypto` library (HMAC SHA256) is enforced for patient and doctor dashboards. API routes `/api/auth/me` and `/api/auth/update-profile` require authentication validation using the Bearer token headers, securing user profile fields.
* **Key Encapsulation:** No active API credentials are saved in source files. Keys are loaded through runtime environments (`process.env.SARVAM_API_KEY`, `process.env.RESEND_API_KEY`, etc.) and injected via Docker.
* **SQL Injection Mitigation:** n8n database nodes use parameterized SQL bindings to isolate user inputs from executable SQL queries.
* **Stateless Testing Isolation:** Patient records, files, and local calendars are bound to client-side browser `localStorage`, preventing data leakage across active test sessions.
* **Basic Auth Access Controls:** Management dashboards for n8n are hidden behind server-enforced basic authentication.

---

## 8. Deployment Architecture

VitaCard is containerized for seamless hosting:
* **Docker Image:** Uses `node:20-bookworm` with PostgreSQL 15, `postgresql-15-pgvector`, and `n8n` global package.
* **Orchestration Script (`start.sh`):** Launches postgres, seeds doctor profiles (`seed_doctors.js`), sets up n8n credentials via curl, imports workflows via the n8n CLI, activates them, and boots the Express backend proxy on port 7860.

---

## 9. Limitations & Future Scope

* **Persistent Database Infrastructure:** The database runs locally inside the Docker container and is reset during deployments. Migrating to a managed cloud database (e.g. Neon, Supabase) is the next phase.
* **UI Controls & Add-ons (Future Scope):** Triage language selector, Speech-to-Text mic input, and client-side report OCR uploads are temporarily commented out in the UI. These features are documented as modular plug-and-play add-ons for future versions.
* **Payment Gateways:** Integrate Stripe or Razorpay to handle actual subscription billing and digital membership issuance.
* **FHIR Standards Compliance:** Standardize clinical summaries using FHIR formatting to enable export to traditional medical databases.

---

## 10. Conclusion

VitaCard Healthcare Platform showcases a state-of-the-art implementation of agentic AI systems in telehealth. By combining client-side OCR, localized voice-to-text, low-code automation workflows, and high-performance vector search, the project delivers a fast and intuitive triage experience that makes private healthcare more accessible.
