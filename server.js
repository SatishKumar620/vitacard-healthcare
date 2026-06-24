const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7860;
const N8N_TARGET = 'http://localhost:5678';

console.log('Starting deployment proxy server...');

const fs = require('fs');

let workflowId = '';
function getWorkflowId() {
  if (workflowId) return workflowId;
  try {
    workflowId = fs.readFileSync('/tmp/workflow_id.txt', 'utf8').trim();
  } catch(e) {
    // Try reading it dynamically if not found
    try {
      workflowId = fs.readFileSync('/app/workflow_id.txt', 'utf8').trim();
    } catch(err) {}
  }
  return workflowId;
}

// ─── Middleware & Helpers for Translation/Speech (Sarvam AI) ───
app.use(express.json({ limit: '10mb' }));

// Helper function to translate text using Sarvam AI
async function translateText(text, sourceLang, targetLang) {
  if (!text || !process.env.SARVAM_API_KEY) {
    return text;
  }
  try {
    const res = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': process.env.SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sourceLang,
        target_language_code: targetLang,
        mode: 'formal',
        model: 'mayura:v1'
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Sarvam Translation error (${res.status}):`, errText);
      return text;
    }
    const data = await res.json();
    return data.translated_text || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Helper function to convert text to speech using Sarvam AI
async function textToSpeech(text, langCode) {
  if (!text || !process.env.SARVAM_API_KEY) {
    return null;
  }
  try {
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': process.env.SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        target_language_code: langCode === 'hi-IN' ? 'hi-IN' : 'en-IN',
        speaker: 'shubh',
        model: 'bulbul:v3'
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Sarvam TTS error (${res.status}):`, errText);
      return null;
    }
    const data = await res.json();
    if (data.audios && data.audios.length > 0) {
      return data.audios[0]; // base64 string
    }
    return null;
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}

// Custom Speech-to-Text Endpoint
app.post('/api/audio-to-text', async (req, res) => {
  const { audio, language } = req.body;
  if (!audio) {
    return res.status(400).json({ error: 'Audio data is required' });
  }
  if (!process.env.SARVAM_API_KEY) {
    return res.status(400).json({ error: 'Sarvam API key is not configured' });
  }

  try {
    const audioBuffer = Buffer.from(audio, 'base64');
    const formData = new FormData();
    const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
    formData.append('file', file);
    formData.append('model', 'saaras:v3');
    if (language) {
      formData.append('language_code', language);
    }

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': process.env.SARVAM_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Sarvam STT response error (${response.status}):`, errText);
      return res.status(response.status).json({ error: 'STT service failed' });
    }

    const data = await response.json();
    res.json({ transcript: data.transcript || '' });
  } catch (error) {
    console.error('STT endpoint error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Custom POST Webhook for Doctor Chat with Translation & TTS
app.post('/webhook/doctor-chat', async (req, res) => {
  const { session_id, message, language } = req.body;
  const targetLang = language || 'en-IN';

  let queryText = message || '';

  // 1. Translate Hindi to English for internal n8n processing if it actually contains Hindi characters
  const containsHindi = /[\u0900-\u097F]/.test(message || '');
  if (targetLang === 'hi-IN' && containsHindi) {
    queryText = await translateText(message, 'hi-IN', 'en-IN');
    console.log(`[Translate Input] Translated "${message}" to "${queryText}"`);
  }

  // 2. Fetch from internal n8n
  const id = getWorkflowId();
  if (!id) {
    return res.status(500).json({ error: 'n8n workflow ID not active' });
  }

  const n8nUrl = `${N8N_TARGET}/webhook/${id}/webhook/doctor-chat`;

  try {
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id,
        message: queryText
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`n8n response error (${response.status}):`, errText);
      return res.status(response.status).json({ error: 'n8n service failed' });
    }

    const data = await response.json();

    if (!data.success) {
      return res.json(data);
    }

    // 3. Translate response from English back to Hindi if necessary
    let responseText = data.message || '';
    let responseCard = data.card;

    if (!responseText && data.type === 'doctor_match' && responseCard && responseCard.ai_analysis) {
      // Use match reason and report summary if present
      const summaryText = responseCard.ai_analysis.report_summary ? `Report Summary: ${responseCard.ai_analysis.report_summary}\n\n` : '';
      responseText = summaryText + (responseCard.ai_analysis.match_reason || responseCard.ai_analysis.recommendation_note || '');
    }

    if (targetLang === 'hi-IN') {
      if (responseText) {
        responseText = await translateText(responseText, 'en-IN', 'hi-IN');
      }
      if (responseCard) {
        responseCard = JSON.parse(JSON.stringify(responseCard));
        if (responseCard.type === 'question_card') {
          if (responseCard.title) {
            responseCard.title = await translateText(responseCard.title, 'en-IN', 'hi-IN');
          }
          if (responseCard.content) {
            responseCard.content = await translateText(responseCard.content, 'en-IN', 'hi-IN');
          }
        } else if (responseCard.type === 'doctor_card') {
          if (responseCard.best_match && responseCard.best_match.bio) {
            responseCard.best_match.bio = await translateText(responseCard.best_match.bio, 'en-IN', 'hi-IN');
          }
          if (responseCard.ai_analysis) {
            if (responseCard.ai_analysis.match_reason) {
              responseCard.ai_analysis.match_reason = await translateText(responseCard.ai_analysis.match_reason, 'en-IN', 'hi-IN');
            }
            if (responseCard.ai_analysis.report_summary) {
              responseCard.ai_analysis.report_summary = await translateText(responseCard.ai_analysis.report_summary, 'en-IN', 'hi-IN');
            }
            if (Array.isArray(responseCard.ai_analysis.key_strengths)) {
              responseCard.ai_analysis.key_strengths = await Promise.all(
                responseCard.ai_analysis.key_strengths.map(str => translateText(str, 'en-IN', 'hi-IN'))
              );
            }
          }
        }
      }

      // Prepend Hindi prefix for doctor match
      if (data.type === 'doctor_match') {
        responseText = 'मैंने आपके अनुरोध का विश्लेषण किया है और निम्नलिखित मिलान वाले डॉक्टर को पाया है:\n\n' + responseText;
      }
    } else {
      // Prepend English prefix for doctor match
      if (data.type === 'doctor_match') {
        responseText = 'I have analyzed your request and found the following matched doctor:\n\n' + responseText;
      }
    }

    // 4. Generate TTS audio
    let textToSpeak = responseText;
    if (!textToSpeak && responseCard && responseCard.type === 'doctor_card') {
      textToSpeak = targetLang === 'hi-IN' ? 'मैंने आपकी आवश्यकताओं के अनुसार सबसे उपयुक्त डॉक्टर ढूंढ लिया है।' : 'I have found a matching doctor for you.';
    }
    const audioBase64 = await textToSpeech(textToSpeak, targetLang);

    res.json({
      ...data,
      message: responseText,
      card: responseCard,
      audio: audioBase64
    });
  } catch (error) {
    console.error('Webhook custom wrapper error:', error);
    res.status(500).json({ error: 'Internal server error in chatbot wrapper' });
  }
});

// ─── Proxy /webhook/* → n8n at /webhook/* ───
app.use(
  '/webhook',
  createProxyMiddleware({
    target: N8N_TARGET,
    changeOrigin: true,
    pathRewrite: (reqPath) => {
      const id = getWorkflowId();
      if (id && (reqPath === '/doctor-chat' || reqPath === '/doctor-chat/')) {
        return `/webhook/${id}/webhook/doctor-chat`;
      }
      return '/webhook' + reqPath;
    },
    logLevel: 'info',
  })
);

app.use(
  '/webhook-test',
  createProxyMiddleware({
    target: N8N_TARGET,
    changeOrigin: true,
    pathRewrite: (reqPath) => {
      const id = getWorkflowId();
      if (id && (reqPath === '/doctor-chat' || reqPath === '/doctor-chat/')) {
        return `/webhook-test/${id}/webhook/doctor-chat`;
      }
      return '/webhook-test' + reqPath;
    },
    logLevel: 'info',
  })
);

// ─── Proxy n8n UI ───────────────────────────────────────
app.use(
  '/n8n',
  createProxyMiddleware({
    target: N8N_TARGET,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      '^/n8n': '',
    },
    logLevel: 'info',
  })
);

// Proxy `/assets` to n8n (Vite uses `/frontend-assets` so this is safe)
app.use(
  '/assets',
  createProxyMiddleware({
    target: N8N_TARGET,
    changeOrigin: true,
    logLevel: 'info',
  })
);

// Proxy `/static` to n8n
app.use(
  '/static',
  createProxyMiddleware({
    target: N8N_TARGET,
    changeOrigin: true,
    logLevel: 'info',
  })
);

// Proxy `/rest` to n8n
app.use(
  '/rest',
  createProxyMiddleware({
    target: N8N_TARGET,
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
  })
);

// ─── Serve static Vite frontend ─────────────────────────
app.use(express.static(path.join(__dirname)));

// ─── Debug Endpoint ───────────────────────────────────────
app.get('/debug-exec', (req, res) => {
  const { execSync } = require('child_process');
  try {
    const cmd = req.query.cmd;
    if(!cmd) return res.send('no cmd');
    const out = execSync(cmd, { encoding: 'utf8' });
    res.send(`<pre>${out}</pre>`);
  } catch(e) {
    res.send(`<pre>${e.toString()}</pre>`);
  }
});

// ─── Debug Error Endpoint ─────────────────────────────────
app.get('/debug-error', (req, res) => {
  const { execSync } = require('child_process');
  try {
    const script = `
import sqlite3, json

def resolve(val, d, memo):
    if isinstance(val, str) and val.isdigit():
        idx = int(val)
        if idx in memo:
            return memo[idx]
        if idx < len(d):
            memo[idx] = "...cyclic..."
            resolved = resolve_item(d[idx], d, memo)
            memo[idx] = resolved
            return resolved
    return val

def resolve_item(item, d, memo):
    if isinstance(item, dict):
        res = {}
        for k, v in item.items():
            res[k] = resolve(v, d, memo)
        return res
    elif isinstance(item, list):
        return [resolve(v, d, memo) for v in item]
    return item

try:
    c = sqlite3.connect("/home/node/.n8n/database.sqlite")
    r = c.cursor()
    r.execute("SELECT executionId, data FROM execution_data ORDER BY executionId DESC LIMIT 1")
    row = r.fetchone()
    if not row:
        print("No executions found")
    else:
        print("=== Resolved Execution Log for ID", row[0], "===")
        d = json.loads(row[1])
        if isinstance(d, list) and len(d) > 0:
            memo = {}
            resolved_root = resolve_item(d[0], d, memo)
            
            result_data = resolved_root.get("resultData", {})
            print("Last Node Executed:", result_data.get("lastNodeExecuted"))
            
            top_err = result_data.get("error")
            if top_err:
                print("TOP ERROR:", json.dumps(top_err, indent=2))
                
            run_data = result_data.get("runData", {})
            print("\\nNode Execution Status:")
            for node_name, runs in run_data.items():
                print(f"  Node '{node_name}':")
                if isinstance(runs, list):
                    for idx, run in enumerate(runs):
                        if isinstance(run, dict):
                            success = "error" not in run
                            print(f"    Run {idx}: success={success}")
                            if not success:
                                print(f"      Error: {json.dumps(run.get('error'))}")
                            execution_data = run.get("data", {})
                            if isinstance(execution_data, dict):
                                for pin_name, pin_data in execution_data.items():
                                    if isinstance(pin_data, list):
                                        print(f"      Pin '{pin_name}' count: {len(pin_data)}")
                                        if len(pin_data) > 0:
                                            print(f"        First item: {json.dumps(pin_data[0])[:400]}")
                        else:
                            print(f"    Run {idx}: non-dict run data")
        else:
            print("Unsupported format or empty list")
    c.close()
except Exception as ex:
    print("Python error:", str(ex))
`;
    const fss = require('fs');
    fss.writeFileSync('/tmp/_dbg_err.py', script);
    const out = execSync('python3 /tmp/_dbg_err.py', { encoding: 'utf8', timeout: 10000 });
    res.type('text/plain').send(out);
  } catch(e) {
    res.type('text/plain').send('Error: ' + e.toString());
  }
});

// ─── Debug Creds Endpoint ─────────────────────────────────
app.get('/debug-creds', (req, res) => {
  const { execSync } = require('child_process');
  try {
    const script = `
import sqlite3, json
c = sqlite3.connect("/home/node/.n8n/database.sqlite")
r = c.cursor()
r.execute("SELECT id, name, type FROM credentials_entity")
creds = r.fetchall()
print("=== Credentials ===")
for cr in creds:
    print(f"  ID={cr[0]} Name={cr[1]} Type={cr[2]}")
r.execute("SELECT id, name, active, nodes FROM workflow_entity LIMIT 1")
wf = r.fetchone()
if wf:
    print(f"\\n=== Workflow ID={wf[0]} Name={wf[1]} Active={wf[2]} ===")
    nodes = json.loads(wf[3])
    for n in nodes:
        if n.get("credentials"):
            print(f"  Node '{n['name']}': {json.dumps(n['credentials'])}")
print()
r.execute("SELECT workflowId, webhookPath, method, node FROM webhook_entity")
whs = r.fetchall()
print("=== Webhooks ===")
for wh in whs:
    print(f"  WF={wh[0]} Path={wh[1]} Method={wh[2]} Node={wh[3]}")
c.close()
`;
    const fss = require('fs');
    fss.writeFileSync('/tmp/_dbg_creds.py', script);
    const out = execSync('python3 /tmp/_dbg_creds.py', { encoding: 'utf8', timeout: 10000 });
    res.type('text/plain').send(out);
  } catch(e) {
    res.type('text/plain').send('Error: ' + e.toString());
  }
});

// ─── JWT Authentication Utilities & Endpoints ───
const crypto = require('crypto');
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'vitacard-default-jwt-secret-key-2026';

// Initialize default users if file doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  const defaultUsers = [
    {
      id: 'user_pat_1',
      email: 'patient@vitacard.com',
      password: 'password',
      role: 'patient',
      name: 'Satish Kumar',
      phone: '+91 98765 43210',
      age: '28',
      gender: 'Male',
      conditions: 'Hypertension (Mild)',
      allergies: 'Penicillin',
      medications: 'Lisinopril 5mg',
      pastReports: []
    },
    {
      id: 'user_doc_1',
      email: 'doctor@vitacard.com',
      password: 'password',
      role: 'doctor',
      name: 'Dr. Nitesh Kumar Singh',
      phone: '+91 91223 34455',
      doctorId: 1
    }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf8');
}

function base64url(buf) {
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h64 = base64url(Buffer.from(JSON.stringify(header)));
  const p64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signInput = h64 + '.' + p64;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signInput).digest();
  const s64 = base64url(signature);
  return h64 + '.' + p64 + '.' + s64;
}

function verifyJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const h64 = parts[0];
    const p64 = parts[1];
    const s64 = parts[2];
    const signInput = h64 + '.' + p64;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(signInput).digest();
    const expectedS64 = base64url(signature);
    if (s64 !== expectedS64) return null;
    return JSON.parse(base64urlDecode(p64));
  } catch (e) {
    return null;
  }
}

function getUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// 1. POST /api/auth/signup
app.post('/api/auth/signup', (req, res) => {
  const { email, password, role, name, phone, age, gender, specialization, clinic, address, city } = req.body;
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'All primary fields are required.' });
  }

  const users = getUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const id = `user_${role}_${Date.now()}`;
  const newUser = {
    id,
    email,
    password,
    role,
    name,
    phone: phone || '',
    age: age || '',
    gender: gender || '',
    conditions: '',
    allergies: '',
    medications: '',
    pastReports: []
  };

  if (role === 'doctor') {
    newUser.doctorId = Date.now() % 10000;
    newUser.specialization = specialization;
    newUser.clinic = clinic;
    newUser.address = address;
    newUser.city = city;
  }

  users.push(newUser);
  saveUsers(users);

  const tokenPayload = { id, email, role, name };
  const token = signJwt(tokenPayload);

  const sessionUser = { ...newUser };
  delete sessionUser.password;

  res.json({ success: true, token, user: sessionUser });
});

// 2. POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email, password, or role.' });
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
  const token = signJwt(tokenPayload);

  const sessionUser = { ...user };
  delete sessionUser.password;

  res.json({ success: true, token, user: sessionUser });
});

// 3. GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const users = getUsers();
  const user = users.find(u => u.id === decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  const sessionUser = { ...user };
  delete sessionUser.password;

  res.json({ success: true, user: sessionUser });
});

// 4. POST /api/auth/update-profile
app.post('/api/auth/update-profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const users = getUsers();
  const userIdx = users.findIndex(u => u.id === decoded.id);
  if (userIdx === -1) {
    return res.status(401).json({ error: 'User not found.' });
  }

  users[userIdx] = { ...users[userIdx], ...req.body };
  if (req.body.enableChatHistory === false) {
    users[userIdx].chatHistory = [];
  }
  saveUsers(users);

  const sessionUser = { ...users[userIdx] };
  delete sessionUser.password;

  res.json({ success: true, user: sessionUser });
});

// ─── Chat History Database Storage Endpoints ───
app.get('/api/chat-history', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const users = getUsers();
  const user = users.find(u => u.id === decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  // Only return history if enableChatHistory is true
  if (!user.enableChatHistory) {
    return res.json({ success: true, chatHistory: [] });
  }

  res.json({ success: true, chatHistory: user.chatHistory || [] });
});

app.post('/api/chat-history', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format.' });
  }

  const users = getUsers();
  const userIdx = users.findIndex(u => u.id === decoded.id);
  if (userIdx === -1) {
    return res.status(401).json({ error: 'User not found.' });
  }

  // Only save if enableChatHistory is true
  if (users[userIdx].enableChatHistory) {
    users[userIdx].chatHistory = messages;
    saveUsers(users);
  }

  res.json({ success: true });
});

// ─── Resend Email Notification Endpoint ───
app.post('/api/send-appointment-email', async (req, res) => {
  const {
    action, // 'book', 'cancel', 'reschedule'
    appointmentId,
    patientName,
    patientEmail,
    patientPhone,
    doctorName,
    doctorEmail,
    specialization,
    clinicName,
    address,
    date,
    time,
    oldDate,
    oldTime,
    notes,
    mode,
    jitsiLink
  } = req.body;

  const resendApiKey = process.env.RESEND_API_KEY || 're_65vpprKs_GJAgs2H2qLFsWqLGWQd4NVsL';
  const isOnline = mode === 'online';
  const locationText = isOnline 
    ? `Online Video Consultation (via Jitsi Meet)` 
    : `${clinicName} (${address})`;

  let patientSubject = `Appointment Confirmed: ${doctorName} - VitaCard Healthcare`;
  let patientHtml = '';
  let doctorSubject = `New Consultation Scheduled: ${patientName} - VitaCard Healthcare`;
  let doctorHtml = '';

  if (action === 'cancel') {
    patientSubject = `Appointment Cancelled: ${doctorName} - VitaCard Healthcare`;
    patientHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #EF4444; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
          <p style="color: #718096; margin: 5px 0 0 0;">Appointment Cancellation Notification</p>
        </div>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your medical appointment with <strong>${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been successfully <strong>cancelled</strong>.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <h3 style="margin-top: 0; color: #2d3748;">Cancelled Appointment Summary</h3>
          <p><strong>Doctor:</strong> ${doctorName} (${specialization})</p>
          <p><strong>Scheduled Slot:</strong> ${date} at ${time}</p>
          <p><strong>Type:</strong> ${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</p>
          <p><strong>Location:</strong> ${locationText}</p>
        </div>

        <p style="color: #718096; font-size: 0.9em; line-height: 1.5;">If you cancelled this by mistake or wish to schedule a new consultation, please log in to your patient dashboard.</p>
        
        <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
          <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
        </div>
      </div>
    `;

    doctorSubject = `Appointment Cancelled: ${patientName} - VitaCard Healthcare`;
    doctorHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #EF4444; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
          <p style="color: #718096; margin: 5px 0 0 0;">Cancellation Alert</p>
        </div>
        <p>Dear <strong>${doctorName}</strong>,</p>
        <p>Please note that the patient <strong>${patientName}</strong> has <strong>cancelled</strong> their scheduled consultation slot.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <h3 style="margin-top: 0; color: #2d3748;">Cancelled Slot Info</h3>
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>Slot Time:</strong> ${date} at ${time}</p>
          <p><strong>Type:</strong> ${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</p>
        </div>

        <p style="color: #718096; font-size: 0.9em; line-height: 1.5;">This slot has been released back to your active calendar queue.</p>
        
        <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
          <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
        </div>
      </div>
    `;
  } else if (action === 'reschedule') {
    patientSubject = `Appointment Rescheduled: ${doctorName} - VitaCard Healthcare`;
    patientHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
          <p style="color: #718096; margin: 5px 0 0 0;">Appointment Rescheduled Notification</p>
        </div>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your medical appointment with <strong>${doctorName}</strong> has been successfully <strong>rescheduled</strong>.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3B82F6;">
          <h3 style="margin-top: 0; color: #2d3748;">Rescheduled Slot Details</h3>
          <p><strong>Doctor:</strong> ${doctorName} (${specialization})</p>
          <p><strong>New Date:</strong> ${date}</p>
          <p><strong>New Time:</strong> ${time}</p>
          <p><strong>Type:</strong> ${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</p>
          <p><strong>Location/Call Link:</strong> ${isOnline && jitsiLink ? `<a href="${jitsiLink}">${jitsiLink}</a>` : locationText}</p>
          ${oldDate ? `<p style="color: #718096; font-size: 0.9em; margin-top: 10px;"><em>Previously scheduled: ${oldDate} at ${oldTime}</em></p>` : ''}
        </div>

        ${isOnline && jitsiLink ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${jitsiLink}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Video Call</a>
        </div>
        ` : ''}

        <p style="color: #718096; font-size: 0.9em; line-height: 1.5;">Please update your calendar. If you need to make further adjustments, log in to your patient dashboard.</p>
        
        <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
          <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
        </div>
      </div>
    `;

    doctorSubject = `Appointment Rescheduled: ${patientName} - VitaCard Healthcare`;
    doctorHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
          <p style="color: #718096; margin: 5px 0 0 0;">Reschedule Alert</p>
        </div>
        <p>Dear <strong>${doctorName}</strong>,</p>
        <p>An appointment with patient <strong>${patientName}</strong> has been <strong>rescheduled</strong>.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3B82F6;">
          <h3 style="margin-top: 0; color: #2d3748;">Rescheduled Slot Info</h3>
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>New Date:</strong> ${date}</p>
          <p><strong>New Time:</strong> ${time}</p>
          <p><strong>Type:</strong> ${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</p>
          <p><strong>Location/Call Link:</strong> ${isOnline && jitsiLink ? `<a href="${jitsiLink}">${jitsiLink}</a>` : locationText}</p>
          ${oldDate ? `<p style="color: #718096; font-size: 0.9em; margin-top: 10px;"><em>Previously scheduled: ${oldDate} at ${oldTime}</em></p>` : ''}
        </div>

        ${isOnline && jitsiLink ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${jitsiLink}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Video Call</a>
        </div>
        ` : ''}

        <p style="color: #718096; font-size: 0.9em; line-height: 1.5;">Your scheduling database has been updated with these parameters.</p>
        
        <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
          <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
        </div>
      </div>
    `;
  } else {
    // default (book)
    patientHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #FF6B00; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
          <p style="color: #718096; margin: 5px 0 0 0;">Appointment Confirmation Notification</p>
        </div>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your medical appointment has been successfully scheduled and confirmed.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #FF6B00;">
          <h3 style="margin-top: 0; color: #2d3748;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #718096; width: 120px;"><strong>Doctor:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${doctorName} (${specialization})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Date:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Time:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${time}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Type:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Location:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">
                ${isOnline ? `Online Video Consultation via Jitsi Meet<br/><span style="font-size: 0.95em;"><a href="${jitsiLink}" style="color: #3b82f6; font-weight: bold; text-decoration: none;">Join Jitsi Meet Call</a></span>` : `${clinicName}<br/><span style="font-size: 0.9em; color: #718096;">${address}</span>`}
              </td>
            </tr>
            ${notes ? `
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Notes:</strong></td>
              <td style="padding: 6px 0; color: #2d3748; font-style: italic;">${notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${isOnline && jitsiLink ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${jitsiLink}" style="background-color: #FF6B00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Jitsi Video Call</a>
        </div>
        ` : ''}

        <p style="color: #718096; font-size: 0.9em; line-height: 1.5;">Please arrive 10 minutes prior or connect at the scheduled hour. If you need to reschedule or cancel, please log in to your patient dashboard or contact the clinic.</p>
        
        <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
          <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
        </div>
      </div>
    `;

    doctorHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
          <p style="color: #718096; margin: 5px 0 0 0;">New Consultation Alert</p>
        </div>
        <p>Dear <strong>${doctorName}</strong>,</p>
        <p>A new consultation has been booked for you through the VitaCard automated system.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10B981;">
          <h3 style="margin-top: 0; color: #2d3748;">Consultation & Patient Info</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #718096; width: 120px;"><strong>Patient:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;"><strong>${patientName}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Phone:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${patientPhone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Date:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Time:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${time}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Type:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Clinic/Location:</strong></td>
              <td style="padding: 6px 0; color: #2d3748;">
                ${isOnline ? `Online Video Consultation via Jitsi Meet<br/><span style="font-size: 0.95em;"><a href="${jitsiLink}" style="color: #3b82f6; font-weight: bold; text-decoration: none;">Join Jitsi Meet Call</a></span>` : `${clinicName} (${address})`}
              </td>
            </tr>
            ${notes ? `
            <tr>
              <td style="padding: 6px 0; color: #718096;"><strong>Notes:</strong></td>
              <td style="padding: 6px 0; color: #2d3748; font-style: italic;">${notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${isOnline && jitsiLink ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${jitsiLink}" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Jitsi Video Call</a>
        </div>
        ` : ''}

        <p style="color: #718096; font-size: 0.9em; line-height: 1.5;">This consultation is logged in your secure doctor dashboard. You can review the patient's profiles, EHR history, or uploaded diagnostics reports directly there.</p>
        
        <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
          <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
        </div>
      </div>
    `;
  }

  // Helper function to send email via Resend
  async function sendEmail({ to, subject, html }) {
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'VitaCard Healthcare <onboarding@resend.dev>', // Resend sandbox default from
            to: to,
            subject: subject,
            html: html
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`❌ Resend API error (${response.status}):`, errText);
          return { success: false, error: errText };
        }

        const data = await response.json();
        console.log(`✅ Email sent via Resend to ${to}. ID:`, data.id);
        return { success: true, id: data.id };
      } catch (err) {
        console.error(`❌ Error calling Resend API for ${to}:`, err);
        return { success: false, error: err.message };
      }
    } else {
      // Mock log
      const separator = '='.repeat(60);
      const mockLog = `
${separator}
📧 [MOCK EMAIL] - ${new Date().toISOString()}
Subject: ${subject}
To: ${to}
Body Preview:
${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 300)}...
${separator}
`;
      console.log(mockLog);
      
      // Write mock log to files
      try {
        fs.appendFileSync('sent_emails.txt', mockLog, 'utf8');
      } catch (e) {
        console.error('Failed to write mock email log:', e);
      }
      return { success: true, mock: true };
    }
  }

  // Send to patient & doctor
  console.log(`📧 Dispatching confirmation emails for booking ${appointmentId}...`);
  const patientResult = await sendEmail({
    to: patientEmail || 'patient@vitacard.com',
    subject: patientSubject,
    html: patientHtml
  });

  const doctorResult = await sendEmail({
    to: doctorEmail || 'doctor@vitacard.com',
    subject: doctorSubject,
    html: doctorHtml
  });

  res.json({
    success: true,
    patientEmail: { sent: patientResult.success, mock: !!patientResult.mock },
    doctorEmail: { sent: doctorResult.success, mock: !!doctorResult.mock }
  });
});

// ─── Resend Appointment Reminder Endpoint ───
app.post('/api/send-appointment-reminder', async (req, res) => {
  const {
    appointmentId,
    patientName,
    patientEmail,
    doctorName,
    doctorEmail,
    specialization,
    clinicName,
    address,
    date,
    time,
    mode,
    jitsiLink,
    notes
  } = req.body;

  const resendApiKey = process.env.RESEND_API_KEY || 're_65vpprKs_GJAgs2H2qLFsWqLGWQd4NVsL';
  const isOnline = mode === 'online';

  const subject = `Appointment Reminder: ${doctorName} - VitaCard Healthcare`;

  const patientHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
        <p style="color: #718096; margin: 5px 0 0 0;">Upcoming Appointment Reminder</p>
      </div>
      <p>Dear <strong>${patientName}</strong>,</p>
      <p>This is a reminder for your upcoming medical appointment with <strong>${doctorName}</strong>.</p>
      
      <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3B82F6;">
        <h3 style="margin-top: 0; color: #2d3748;">Appointment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #718096; width: 120px;"><strong>Doctor:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;">${doctorName} (${specialization})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096;"><strong>Date & Time:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;">${date} at ${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096;"><strong>Type:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;">${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096;"><strong>Location:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;">
              ${isOnline ? `Online Video Consultation via Jitsi Meet<br/><span style="font-size: 0.95em;"><a href="${jitsiLink}" style="color: #3b82f6; font-weight: bold; text-decoration: none;">Join Jitsi Meet Call</a></span>` : `${clinicName}<br/><span style="font-size: 0.9em; color: #718096;">${address}</span>`}
            </td>
          </tr>
        </table>
      </div>

      ${isOnline && jitsiLink ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${jitsiLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Video Consultation</a>
      </div>
      ` : ''}

      <p style="color: #718096; font-size: 0.9em; line-height: 1.5;">Please ensure that you connect or arrive 10 minutes prior to your scheduled time. If you need to make changes, please log in to your patient dashboard.</p>
      
      <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
        <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
      </div>
    </div>
  `;

  const doctorHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #1a202c; margin: 0;">VitaCard Healthcare Portal</h2>
        <p style="color: #718096; margin: 5px 0 0 0;">Consultation Reminder Alert</p>
      </div>
      <p>Dear <strong>${doctorName}</strong>,</p>
      <p>This is a reminder that you have an upcoming consultation with patient <strong>${patientName}</strong>.</p>
      
      <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3B82F6;">
        <h3 style="margin-top: 0; color: #2d3748;">Consultation Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #718096; width: 120px;"><strong>Patient:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;"><strong>${patientName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096;"><strong>Date & Time:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;">${date} at ${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096;"><strong>Type:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;">${isOnline ? 'Online (Video Consultation)' : 'In-Person (Offline)'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096;"><strong>Clinic/Location:</strong></td>
            <td style="padding: 6px 0; color: #2d3748;">
              ${isOnline ? `Online Video Consultation via Jitsi Meet<br/><span style="font-size: 0.95em;"><a href="${jitsiLink}" style="color: #3b82f6; font-weight: bold; text-decoration: none;">Join Jitsi Meet Call</a></span>` : `${clinicName} (${address})`}
            </td>
          </tr>
        </table>
      </div>

      ${isOnline && jitsiLink ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${jitsiLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Video Consultation</a>
      </div>
      ` : ''}

      <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 0.8em; color: #a0aec0;">
        <p>© 2026 VitaCard Healthcare. Secure and Automated Patient Notification System.</p>
      </div>
    </div>
  `;

  async function sendEmail({ to, subject, html }) {
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'VitaCard Healthcare <onboarding@resend.dev>',
            to: to,
            subject: subject,
            html: html
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          return { success: false, error: errText };
        }
        const data = await response.json();
        return { success: true, id: data.id };
      } catch (err) {
        return { success: false, error: err.message };
      }
    } else {
      const separator = '='.repeat(60);
      const mockLog = `
${separator}
📧 [MOCK REMINDER EMAIL] - ${new Date().toISOString()}
Subject: ${subject}
To: ${to}
Body Preview:
${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 300)}...
${separator}
`;
      console.log(mockLog);
      try {
        fs.appendFileSync('sent_emails.txt', mockLog, 'utf8');
      } catch (e) {}
      return { success: true, mock: true };
    }
  }

  console.log(`📧 Sending reminder emails for booking ${appointmentId}...`);
  const patientResult = await sendEmail({
    to: patientEmail || 'patient@vitacard.com',
    subject: subject,
    html: patientHtml
  });

  const doctorResult = await sendEmail({
    to: doctorEmail || 'doctor@vitacard.com',
    subject: subject,
    html: doctorHtml
  });

  res.json({
    success: true,
    patientEmail: { sent: patientResult.success, mock: !!patientResult.mock },
    doctorEmail: { sent: doctorResult.success, mock: !!doctorResult.mock }
  });
});

// Fallback for SPA routing if needed
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server listening on port ${PORT}`);
  console.log(`n8n expected internally on ${N8N_TARGET}`);
});
