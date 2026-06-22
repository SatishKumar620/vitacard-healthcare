-- VitaCard Database Schema
-- Creates all required tables for the n8n RAG workflow

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Doctors Table (matches the actual doctors.json fields) ──
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    s_no INT UNIQUE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    clinic VARCHAR(255),
    address TEXT,
    city VARCHAR(255),
    phone VARCHAR(255),
    source VARCHAR(255),
    -- derived / enriched fields for the RAG workflow
    experience_years INT DEFAULT 5,
    rating DECIMAL(2,1) DEFAULT 4.5,
    fee_range VARCHAR(100) DEFAULT '₹300-₹800',
    bio TEXT,
    languages TEXT DEFAULT 'Hindi, English',
    availability VARCHAR(100) DEFAULT 'Mon-Sat, 9AM-6PM',
    hospital_name VARCHAR(255),
    email VARCHAR(255),
    profile_image_url TEXT,
    location VARCHAR(255),
    -- pgvector embedding column (1024 dims for Cohere embed-english-v3.0)
    embedding vector(1024)
);

-- ── Chat Sessions Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    original_query TEXT,
    questions_asked JSONB DEFAULT '[]'::jsonb,
    answers_collected JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'questioning',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Session Messages Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS session_messages (
    id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES chat_sessions(session_id),
    role VARCHAR(10) NOT NULL,
    content TEXT,
    turn_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_messages_session ON session_messages(session_id);
