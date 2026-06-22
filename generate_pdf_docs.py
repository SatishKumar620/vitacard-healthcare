import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# ─── Custom Numbered Canvas for Header, Footer and Page Numbering ───
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        self.saveState()
        
        # 1. Cover Page styling
        if self._pageNumber == 1:
            # Top accent bar (Orange #FF6B00)
            self.setFillColor(colors.HexColor('#FF6B00'))
            self.rect(0, 800, 595.27, 42, fill=1, stroke=0)
            # Bottom accent bar (Dark Charcoal #120B08)
            self.setFillColor(colors.HexColor('#120B08'))
            self.rect(0, 0, 595.27, 120, fill=1, stroke=0)
            # Visual graphic accent line
            self.setStrokeColor(colors.HexColor('#FF6B00'))
            self.setLineWidth(3)
            self.line(54, 520, 180, 520)
            self.restoreState()
            return
            
        # 2. Inside Pages Headers and Footers
        # Header text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor('#718096'))
        self.drawString(54, 792, "VITACARD HEALTHCARE PLATFORM")
        self.setFont("Helvetica", 8)
        self.drawRightString(541.27, 792, "TECHNICAL ARCHITECTURE DOCUMENTATION")
        
        # Header thin divider line
        self.setStrokeColor(colors.HexColor('#E2E8F0'))
        self.setLineWidth(0.5)
        self.line(54, 782, 541.27, 782)
        
        # Footer thin divider line
        self.line(54, 60, 541.27, 60)
        
        # Footer text
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#A0AEC0'))
        self.drawString(54, 45, "Confidential · VitaCard Healthcare Membership Systems v1.0")
        
        # Page Number "Page X of Y"
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(541.27, 45, page_text)
        
        self.restoreState()

# ─── Main PDF Generation Function ───
def generate_pdf(output_filename):
    # Page dimensions A4: 595.27 x 841.89 pt
    # Left and Right margins: 54 pt (0.75 in). Top: 72 pt, Bottom: 72 pt
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Define Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        textColor=colors.HexColor('#120B08'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=15,
        leading=20,
        textColor=colors.HexColor('#FF6B00'),
        spaceAfter=40
    )
    
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=16,
        textColor=colors.HexColor('#718096'),
        spaceAfter=6
    )
    
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#120B08'),
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#FF6B00'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#2D3748'),
        bulletIndent=12,
        leftIndent=24,
        spaceAfter=4
    )
    
    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1A202C'),
        backColor=colors.HexColor('#F7FAFC'),
        borderColor=colors.HexColor('#E2E8F0'),
        borderWidth=0.5,
        borderPadding=8,
        spaceAfter=12
    )

    story = []

    # ════════════════════════════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 140))
    story.append(Paragraph("VitaCard Healthcare<br/>Platform", title_style))
    story.append(Paragraph("Technical Documentation & System Blueprint", subtitle_style))
    
    story.append(Spacer(1, 160))
    story.append(Paragraph("<b>System Core:</b> React 19 / Node.js Express / PostgreSQL / n8n Workflow", meta_style))
    story.append(Paragraph("<b>Integrations:</b> Sarvam AI (TTS/STT/Translation), Groq (LLM), Cohere (Embeddings)", meta_style))
    story.append(Paragraph("<b>Deployment Target:</b> Docker / Hugging Face Spaces App", meta_style))
    story.append(Paragraph("<b>Version:</b> 1.0.0 (Production Release)", meta_style))
    story.append(Paragraph("<b>Date:</b> June 2026", meta_style))
    
    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════
    # SECTION 1: INTRODUCTION
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Introduction", h1_style))
    story.append(Paragraph(
        "Modern primary healthcare delivery models face significant challenges, including severe "
        "administrative loads, search friction when identifying appropriate clinical specialists, and "
        "prohibitive wait times in public healthcare frameworks. The VitaCard Healthcare Platform "
        "is engineered to bridge this gap. By offering a subscription-based, private healthcare "
        "membership starting from £9.99/month, VitaCard grants users instant access to private GPs, "
        "dentists, physical therapists, and mental wellness clinicians, accompanied by discounts of "
        "up to 20% on routine consultations and diagnostics.",
        body_style
    ))
    story.append(Paragraph(
        "VitaCard leverages an agentic artificial intelligence backbone to automate the patient triage "
        "and doctor discovery pipeline. The software combines low-code automation workflows, "
        "semantic vector search, multilingual speech and translation engines, and client-side optical "
        "character recognition (OCR) to deliver a seamless, state-of-the-art telehealth experience.",
        body_style
    ))
    
    # ════════════════════════════════════════════════════════════════════
    # SECTION 2: PROJECT OBJECTIVES
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Project Objectives", h1_style))
    story.append(Paragraph(
        "The primary engineering and operational objectives of the VitaCard system include:",
        body_style
    ))
    story.append(Paragraph("• <b>Clinical Matching Optimization:</b> Replace keyword-based doctor matching with high-dimensional vector search to map specific user symptoms to specialized medical practitioners.", bullet_style))
    story.append(Paragraph("• <b>Low-latency Triage Automation:</b> Enable a multi-turn AI chatbot session to collect vital anamnesis context (symptoms, duration, urgency) before initiating search queries.", bullet_style))
    story.append(Paragraph("• <b>Multilingual Accessibility:</b> Provide native speech-to-text, text-to-speech, and automatic translation for Hindi and English users, accommodating varying levels of digital literacy.", bullet_style))
    story.append(Paragraph("• <b>Document Processing Decoupling:</b> Execute high-fidelity OCR client-side to parse diagnostic lab report files, avoiding expensive server-side compute and conserving user bandwidth.", bullet_style))
    story.append(Paragraph("• <b>Automated Communications:</b> Integrate transactional email dispatchers to notify both patients and clinics instantly upon successful consultation booking.", bullet_style))
    
    story.append(Spacer(1, 10))

    # ════════════════════════════════════════════════════════════════════
    # SECTION 3: SYSTEM ARCHITECTURE
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. System Architecture", h1_style))
    story.append(Paragraph(
        "The VitaCard system is structured as a decoupled, multi-layered service architecture. "
        "The web client interacts directly with an Express.js backend proxy, which serves static frontend "
        "assets and routes specialized API requests to an internal n8n Automation Engine, speech translation APIs, "
        "or a local PostgreSQL database with the pgvector extension. Below is the blueprint representation of the "
        "integrated components and their interaction pathways:",
        body_style
    ))
    
    # Embed Architecture Image
    img_path = "/home/satish/Desktop/medical-bot/system_architecture.png"
    if os.path.exists(img_path):
        story.append(Spacer(1, 5))
        # Keep diagram on the same page or next page neatly
        story.append(KeepTogether([
            Image(img_path, width=420, height=420),
            Paragraph("<i>Figure 1: Architectural diagram of the VitaCard Healthcare Platform, showcasing the data flow and boundary boundaries between UI, services, databases, and LLM providers.</i>", ParagraphStyle('Caption', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, leading=10, textColor=colors.HexColor('#718096'), alignment=1, spaceBefore=6))
        ]))
        story.append(Spacer(1, 15))
    else:
        story.append(Paragraph("<i>[Architecture diagram image 'system_architecture.png' not found in workspace root]</i>", body_style))

    story.append(PageBreak())

    # Architectural Layers Detail
    story.append(Paragraph("3.1 Component Breakdown", h2_style))
    story.append(Paragraph(
        "The system boundaries are divided into three distinct operational domains:",
        body_style
    ))
    story.append(Paragraph("1. <b>User Access & UI Layer (React Frontend):</b> A client application built on React 19 and Vite. It renders a dark-themed glassmorphic dashboard interface, interactive Three.js 3D canvas objects, dynamic patient/doctor panels, SVG graphs, and an adaptive audio/text chat window.", bullet_style))
    story.append(Paragraph("2. <b>Gateway & Service Layer (Express.js Backend):</b> Acts as a security proxy and routing gateway. It handles CORS, serves compiled React assets, transcodes base64 audio requests, translates between Hindi and English, and routes webhook calls to n8n. It runs on the Hugging Face container port 7860.", bullet_style))
    story.append(Paragraph("3. <b>Data and Intelligence Layer (n8n, PostgreSQL, and LLMs):</b> n8n functions as the workflow execution engine, querying PostgreSQL for doctor matching and patient sessions. High-dimensional vector search is handled natively via pgvector. Natural language generation (NLG) is delegated to Groq LLMs, and vector embeddings are generated by Cohere.", bullet_style))

    # ════════════════════════════════════════════════════════════════════
    # SECTION 4: CORE FEATURES
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. Core Features", h1_style))
    story.append(Paragraph(
        "VitaCard encompasses several advanced features designed to maximize patient convenience and administrative efficiency:",
        body_style
    ))
    story.append(Paragraph("• <b>Conversational Medical Triage:</b> An AI-led session chat widget that uses LLM-generated questions to clarify the user's condition. The chatbot scales up to 75% of the viewport on desktop and uses smooth micro-animations to enhance readability.", bullet_style))
    story.append(Paragraph("• <b>Tesseract.js OCR report Parsing:</b> Patients can upload medical diagnostic images (e.g. blood reports). The client application performs OCR in-browser, extracts raw clinical values, and feeds the resulting string directly into the chatbot session to automate matching.", bullet_style))
    story.append(Paragraph("• <b>Sarvam AI Hindi & Voice Integration:</b> Full support for bilingual voice communications. If the user selects Hindi, the Express server translates typed/spoken inputs to English for backend vector matching, and converts the English output back to Hindi, followed by TTS synthesis using the Bulbul:v3 neural voice model.", bullet_style))
    story.append(Paragraph("• <b>EHR Patient & Doctor Dashboards:</b> Patients track scheduled appointments, upload new reports, view active notifications, and inspect their digital membership card. Doctors access a live queue of incoming patients, write Electronic Health Records (EHR) notes, and edit clinic timetables.", bullet_style))
    story.append(Paragraph("• <b>Resend API Email Alerts:</b> When an appointment is scheduled, the system initiates a POST request to `/api/send-appointment-email`. The server invokes the Resend SDK to dispatch structured HTML confirmation emails containing location, date, time, and preparation instructions to both the doctor and patient.", bullet_style))

    # ════════════════════════════════════════════════════════════════════
    # SECTION 5: SYSTEM WORKFLOW
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. System Workflow", h1_style))
    story.append(Paragraph(
        "The standard operational workflow of the platform proceeds as follows:",
        body_style
    ))
    story.append(Paragraph("1. <b>Session Initialization:</b> The patient logs in, triggering a 5-second animated 'Welcome Back' toast. They navigate to the medical assistant chat.", bullet_style))
    story.append(Paragraph("2. <b>Information Harvesting:</b> The patient types symptoms or uploads a lab report. The n8n engine starts a new database session, registers the query, and uses Groq (Llama-3.3-70b) to prompt the user for at least two specific details (e.g. location, urgency, primary symptom).", bullet_style))
    story.append(Paragraph("3. <b>Embedding & Search:</b> Once sufficient variables are collected, n8n compiles the full conversation context, requests an embedding vector from Cohere, and performs an L2 distance query against the `doctors` table in PostgreSQL.", bullet_style))
    story.append(Paragraph("4. <b>Ranking & Display:</b> The matched profiles are passed to Groq for final evaluation and rerank. The matched doctor profile (plus up to three secondary recommendations) is displayed to the user as a styled layout card.", bullet_style))
    story.append(Paragraph("5. <b>Scheduling & Dispatch:</b> The user books an appointment from the card. The local state updates, rendering the appointment card on both patient and doctor calendars, while the backend fires confirmation emails to both parties.", bullet_style))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════
    # SECTION 6: N8N AUTOMATION
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("6. n8n Automation Workflows", h1_style))
    story.append(Paragraph(
        "The core data flow and logic of the clinical matchmaker chatbot are orchestrated by n8n. "
        "The workflow JSON (`doctor_rag_workflow.json`) configures a webhook-triggered graph with integrated "
        "error handling and database logging. A textual map of the automation nodes is described below:",
        body_style
    ))
    
    story.append(Paragraph(
        "[HTTP Webhook] (POST /doctor-chat)\n"
        "      │\n"
        "      ▼\n"
        "[Parse Input] (Extracts Session ID, Message Text, Language)\n"
        "      │\n"
        "      ▼\n"
        "[Is New Session?] ──(Yes)──> [Create Session in PostgreSQL]\n"
        "      │                      (Gen UUID, Store Initial Query)\n"
        "    (No)                     │\n"
        "      │                      ▼\n"
        "      ├──────────────────────┘\n"
        "      ▼\n"
        "[Save User Message] (Inserts message text to database message log)\n"
        "      │\n"
        "      ▼\n"
        "[Session Flow Logic] (Calculates progress: checks details collected count)\n"
        "      │\n"
        "      ├─(Progress < 100%)──> [Build Question Prompt] ──> [Groq LLM] ──> [Extract & Save] ──> [Respond]\n"
        "      │                                                                                     (Clarifying Q)\n"
        "      └─(Progress == 100%)─> [Build Search Context] ──> [Cohere Embed] ──> [pgvector Search]\n"
        "                                                                                 │\n"
        "                                                                                 ▼\n"
        "                                                                           [Groq Rerank & Select Best]\n"
        "                                                                                 │\n"
        "                                                                                 ▼\n"
        "                                                                           [Build Doctor Card Details]\n"
        "                                                                                 │\n"
        "                                                                                 ▼\n"
        "                                                                           [Update Session Done] ──> [Respond]",
        code_style
    ))

    # ════════════════════════════════════════════════════════════════════
    # SECTION 7: SECURITY CONSIDERATIONS
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Security Considerations", h1_style))
    story.append(Paragraph(
        "Protecting medical data and system integrations is a critical design priority for the VitaCard platform:",
        body_style
    ))
    story.append(Paragraph("• <b>Environment Key Encapsulation:</b> Under no circumstances are active API keys (Sarvam, Resend, Groq, Cohere) hardcoded in the codebase. All credentials are load-injected at runtime via Docker container environment variables. Git configuration ensures `.env` is never committed.", bullet_style))
    story.append(Paragraph("• <b>SQL Injection Prevention:</b> All database interactions executed within the n8n postgres nodes use prepared parameter bindings. User message text is explicitly scrubbed and escaped to prevent command execution.", bullet_style))
    story.append(Paragraph("• <b>Client-side Isolation:</b> Session states, clinical OCR report extractions, and appointment lists are kept in the client browser's `localStorage`. This isolated design prevents cross-tenant leaks in the stateless testing environment.", bullet_style))
    story.append(Paragraph("• <b>n8n Gateway Security:</b> The Express server exposes *only* the specific webhook endpoint (`/webhook/doctor-chat`) to public traffic. The n8n management UI and REST APIs are locked behind Basic Authentication, preventing unauthorized workflow manipulation.", bullet_style))

    # ════════════════════════════════════════════════════════════════════
    # SECTION 8: DEPLOYMENT ARCHITECTURE
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("8. Deployment Architecture", h1_style))
    story.append(Paragraph(
        "VitaCard is deployed as a single, containerized service on Hugging Face Spaces utilizing Docker. "
        "The configuration files include a `Dockerfile` and a bootstrap orchestrator `start.sh` to initialize the "
        "dependencies sequentially:",
        body_style
    ))
    story.append(Paragraph("1. <b>Base Image:</b> The container builds on `node:20-bookworm`. It adds the official PostgreSQL apt repository and installs `postgresql-15` and `postgresql-15-pgvector`.", bullet_style))
    story.append(Paragraph("2. <b>Database Initialization:</b> The container launches PostgreSQL, creates `vitacard_db`, applies migrations from `init_schema.sql`, and runs `seed_doctors.js` to seed 313 doctor records from the Jamshedpur area.", bullet_style))
    story.append(Paragraph("3. <b>n8n Auto-Configuration:</b> The container launches n8n internally. A Python script reads the credentials generated during owner setup, patches the credentials entity IDs into `doctor_rag_workflow.json`, and imports the workflow via the n8n CLI.", bullet_style))
    story.append(Paragraph("4. <b>Express Web Server:</b> Finally, the container boots the Express proxy on port 7860. The proxy serves the Vite-built static files and routes public traffic safely to the internal n8n ports.", bullet_style))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════
    # SECTION 9: LIMITATIONS & FUTURE SCOPE
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("9. Limitations & Future Scope", h1_style))
    story.append(Paragraph(
        "While the prototype exhibits robust performance, certain system boundaries define the scope of future development:",
        body_style
    ))
    story.append(Paragraph("• <b>Database Persistence:</b> The local PostgreSQL database is contained within the Docker instance. Restarts recycle the container, clearing user booked appointments. Future work involves migrating to a persistent external database (e.g. Supabase, Neon PostgreSQL).", bullet_style))
    story.append(Paragraph("• <b>Authentication Framework:</b> Authentication currently uses simulated roles stored in LocalStorage. A production deployment will require transition to Firebase Authentication or Auth0 for JWT token-based authentication.", bullet_style))
    story.append(Paragraph("• <b>Payment & Billing Gateway:</b> The membership billing is simulated. Integrating Stripe or Razorpay API gateways is planned to handle real subscriptions and automate membership card activation.", bullet_style))
    story.append(Paragraph("• <b>EHR Standards Compliance:</b> Currently, health records are logged in plain text. Future iterations will map patient data structures to the FHIR (Fast Healthcare Interoperability Resources) standard to enable interoperability with hospitals.", bullet_style))

    # ════════════════════════════════════════════════════════════════════
    # SECTION 10: CONCLUSION
    # ════════════════════════════════════════════════════════════════════
    story.append(Paragraph("10. Conclusion", h1_style))
    story.append(Paragraph(
        "The VitaCard Healthcare Platform represents a significant advancement in automated, digital "
        "telehealth portals. By combining modern React UI designs, powerful vector search capabilities, "
        "and low-code automation workflows via n8n, the system demonstrates how AI can drastically reduce "
        "the time required for clinical discovery. As an integrated agentic system, VitaCard provides a "
        "scalable foundation for high-quality, cost-effective private healthcare membership systems.",
        body_style
    ))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    generate_pdf("/home/satish/Desktop/medical-bot/VitaCard_Healthcare_Platform_Documentation.pdf")
    print("PDF generated successfully.")
