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

---

## 3. System Architecture

The VitaCard codebase is divided into three logical layers:
1. **User Interface (React 19 & Vite 8):** Renders glassmorphic dashboards, 3D Three.js background canvasses, scheduling calendar modules, and the main audio/text chatbot.
2. **Gateway & Proxy (Express.js):** Acts as the public portal. Serves static frontend files and exposes APIs to transcode audio, translate speech inputs, and route n8n webhooks.
3. **Data & AI Layer (PostgreSQL with pgvector, n8n, LLMs):** n8n orchestrates workflows, postgres manages doctor data, Groq (Llama-3.3-70b) runs LLM tasks, and Cohere generates embeddings.

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

The automated matchmaking logic is driven by n8n. The flow is defined inside `doctor_rag_workflow.json` and consists of the following components:
* **HTTP Webhook Node:** Listens for POST requests at `/webhook/doctor-chat`.
* **PostgreSQL Nodes:** Create or retrieve active session records and write chat logs.
* **Session Logic (JavaScript Code Node):** Implements heuristic checkpoints to determine if clarifying questions are needed or if triage is complete.
* **Groq Chat Completion Nodes:** Generate context-aware clarifying questions or perform final ranking of pgvector doctor search results.
* **Cohere Embeddings Node:** Converts the aggregated patient triage dialogue into a 1024-dimensional floating-point vector.
* **pgvector Search Node:** Computes cosine distance against the database table using L2 operator `<=>`.

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
