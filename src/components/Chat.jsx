import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { getCurrentSession, subscribeToState, getPatientById } from '../utils/state';

/* ─── Question Progress Card Component ──────────────── */
function QuestionProgressCard({ card }) {
  return (
    <div className="chat-question-card">
      <div className="qcard-header">
        <span className="qcard-badge">{card.badge || 'Clarifying'}</span>
        <span className="qcard-title">{card.title || 'Doctor Match Guide'}</span>
      </div>
      <div className="qcard-content">{card.content}</div>
      {card.progress_bar !== undefined && (
        <div className="qcard-progress-container">
          <div className="qcard-progress-bar" style={{ width: `${card.progress_bar}%` }}></div>
        </div>
      )}
    </div>
  );
}

/* ─── Doctor Match Card Component ───────────────────── */
function DoctorMatchCard({ card, language, onLinkClick }) {
  const doc = card.best_match;
  const analysis = card.ai_analysis;

  if (!doc) return null;

  return (
    <div className="chat-doctor-card">
      <div className="doc-match-header">
        <div className="doc-match-badge">⭐ {language === 'hi-IN' ? 'सर्वश्रेष्ठ मिलान' : 'Best Match'} ({doc.similarity_score || 100}% {language === 'hi-IN' ? 'मिलान' : 'Match'})</div>
        {analysis?.confidence_score && (
          <div className="doc-confidence-badge">{language === 'hi-IN' ? 'AI विश्वास' : 'AI Confidence'}: {analysis.confidence_score}%</div>
        )}
      </div>
      
      <div className="doc-profile-row">
        <div className="doc-avatar-placeholder">
          {doc.profile_image_url ? (
            <img src={doc.profile_image_url} alt={doc.name} className="doc-avatar-img" />
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#FFAE73">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          )}
        </div>
        <div className="doc-meta">
          <div className="doc-name">{doc.name}</div>
          <div className="doc-specialty">{doc.specialization}</div>
          <div className="doc-exp">{doc.experience_years} {language === 'hi-IN' ? 'वर्षों का अनुभव' : 'Years Experience'}</div>
          <div className="doc-rating">⭐ {doc.rating} / 5.0 {language === 'hi-IN' ? 'रेटिंग' : 'Rating'}</div>
        </div>
      </div>
      
      {doc.bio && (
        <div className="doc-bio-section">
          <p className="doc-bio">"{doc.bio}"</p>
        </div>
      )}

      {analysis?.report_summary && (
        <div className="ai-analysis-box" style={{ marginBottom: '12px', borderLeft: '3px solid var(--g-emerald)' }}>
          <div className="ai-analysis-title">
            {language === 'hi-IN' ? '📄 चिकित्सा रिपोर्ट सारांश:' : '📄 Medical Report Summary:'}
          </div>
          <p className="ai-analysis-reason" style={{ fontStyle: 'italic' }}>{analysis.report_summary}</p>
        </div>
      )}

      {analysis?.match_reason && (
        <div className="ai-analysis-box">
          <div className="ai-analysis-title">
            {language === 'hi-IN' ? 'यह डॉक्टर आपकी आवश्यकताओं के अनुकूल क्यों है:' : 'Why this doctor fits your query:'}
          </div>
          <p className="ai-analysis-reason">{analysis.match_reason}</p>
          {analysis.key_strengths && analysis.key_strengths.length > 0 && (
            <div className="doc-strengths">
              {analysis.key_strengths.map((str, i) => (
                <span key={i} className="strength-badge">{str}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="doc-details-grid">
        <div className="doc-detail-item">
          <strong>Hospital:</strong> {doc.hospital_name || 'Partner Clinic'}
        </div>
        <div className="doc-detail-item">
          <strong>Location:</strong> {doc.location || 'UK'}
        </div>
        <div className="doc-detail-item">
          <strong>Languages:</strong> {Array.isArray(doc.languages) ? doc.languages.join(', ') : (doc.languages || 'English')}
        </div>
        <div className="doc-detail-item">
          <strong>Fee:</strong> {doc.fee_range || 'Varies'}
        </div>
      </div>

      <div className="doc-contact-actions">
        {doc.phone && (
          <a href={`tel:${doc.phone}`} className="doc-action-btn phone">
            Call Clinic
          </a>
        )}
        {doc.email && (
          <a href={`mailto:${doc.email}`} className="doc-action-btn email">
            Email Request
          </a>
        )}
        <a href={`#/doctor/${doc.id}`} className="doc-action-btn book-btn" onClick={onLinkClick}>
          View Profile
        </a>
      </div>

      {card.other_options && card.other_options.length > 0 && (
        <div className="other-options-section">
          <div className="other-title">Other Matching Options:</div>
          <div className="other-list">
            {card.other_options.map((other, i) => (
              <a 
                href={`#/doctor/${other.id}`} 
                key={i} 
                className="other-option-row clickable"
                onClick={onLinkClick}
                style={{ textDecoration: 'none' }}
              >
                <div className="other-meta">
                  <div className="other-name" style={{ color: 'var(--g-emerald)' }}>{other.name}</div>
                  <div className="other-spec">{other.specialization} • {other.location || 'Local'}</div>
                </div>
                {other.similarity_score !== undefined && (
                  <div className="other-score">{other.similarity_score}% Match</div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState('en-IN');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [session, setSession] = useState(getCurrentSession());

  useEffect(() => {
    const handleStateChange = () => {
      const curSession = getCurrentSession();
      setSession(curSession);
      setHasOpened(false); // Reset so welcome/history logic re-runs on session change
    };
    return subscribeToState(handleStateChange);
  }, []);

  useEffect(() => {
    const curSession = getCurrentSession();
    if (curSession && curSession.role === 'patient' && messages.length > 0) {
      const pProfile = getPatientById(curSession.id);
      if (pProfile && pProfile.enableChatHistory) {
        localStorage.setItem(`vitacard_chat_history_${curSession.id}`, JSON.stringify(messages));
      }
    }
  }, [messages]);

  const msgsEndRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const getWelcomeText = (lang) => {
    if (lang === 'hi-IN') {
      return "VitaCard AI स्वास्थ्य सहायक में आपका स्वागत है! 🩺 मुझे अपनी समस्याओं या चिकित्सा चिंताओं के बारे में बताएं, और मैं आपको सही विशेषज्ञ से मिलाने के लिए कुछ त्वरित प्रश्न पूछूंगा।";
    }
    return "Welcome to the VitaCard AI Health Assistant! 🩺 Tell me about your symptoms or medical concerns, and I will ask a few quick questions to match you with the perfect specialist.";
  };

  const getWelcomeQuickReplies = (lang) => {
    if (lang === 'hi-IN') {
      return [
        "दंत चिकित्सक (Dentist)",
        "सामान्य चिकित्सक (GP)",
        "चिंता (Anxiety) के लिए थेरेपिस्ट",
        "कार्डियोलॉजिस्ट (Cardiologist)"
      ];
    }
    return [
      "I need a dentist",
      "Looking for a private GP",
      "Therapist for anxiety",
      "Find a cardiologist"
    ];
  };

  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true);
      setShowNotification(false);
      
      const curSession = getCurrentSession();
      if (curSession && curSession.role === 'patient') {
        const pProfile = getPatientById(curSession.id);
        if (pProfile && pProfile.enableChatHistory) {
          const savedHistory = localStorage.getItem(`vitacard_chat_history_${curSession.id}`);
          if (savedHistory) {
            try {
              setMessages(JSON.parse(savedHistory));
              return;
            } catch (e) {
              console.error("Failed to parse saved chat history:", e);
            }
          }
        }
      }

      // Default welcome message if no history found or enabled
      setTimeout(() => {
        setMessages([
          {
            sender: 'bot',
            text: getWelcomeText(language),
            quickReplies: getWelcomeQuickReplies(language)
          }
        ]);
      }, 320);
    }
  }, [isOpen, hasOpened, language]);

  useEffect(() => {
    if (hasOpened && messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([
        {
          sender: 'bot',
          text: getWelcomeText(language),
          quickReplies: getWelcomeQuickReplies(language)
        }
      ]);
    }
  }, [language]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const speakText = (text, serverAudioBase64) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    if (serverAudioBase64) {
      try {
        const audioUrl = `data:audio/wav;base64,${serverAudioBase64}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().catch(e => {
          console.warn("Audio element play failed, falling back to Web Speech:", e);
          fallbackSpeechSynthesis(text);
        });
      } catch (err) {
        console.warn("Audio initialization failed, falling back to Web Speech:", err);
        fallbackSpeechSynthesis(text);
      }
    } else {
      fallbackSpeechSynthesis(text);
    }
  };

  const fallbackSpeechSynthesis = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.includes(language === 'hi-IN' ? 'hi' : 'en-IN'));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const runBrowserSTT = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Speech Recognition not supported in this browser. Please try Chrome/Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputVal(transcript);
    };

    recognition.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const startRecording = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1];
          setIsTyping(true);
          try {
            const response = await fetch('/api/audio-to-text', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                audio: base64Data,
                language: language
              })
            });

            if (!response.ok) {
              throw new Error('STT service failed');
            }

            const data = await response.json();
            if (data.transcript) {
              setInputVal(data.transcript);
            }
          } catch (error) {
            console.warn("Server STT failed or not configured, falling back to browser webkitSpeechRecognition:", error);
            runBrowserSTT();
          } finally {
            setIsTyping(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("MediaRecorder permission denied or unsupported. Using browser Speech Recognition:", err);
      runBrowserSTT();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input so the same file can be uploaded again if needed
    event.target.value = null;

    setIsUploading(true);
    setIsTyping(true);

    const analyzingText = language === 'hi-IN'
      ? `आपकी छवि (${file.name}) का विश्लेषण किया जा रहा है... कृपया कुछ क्षण प्रतीक्षा करें।`
      : `Analyzing your image (${file.name})... This may take a moment.`;

    setMessages((prev) => [
      ...prev,
      { sender: 'bot', text: analyzingText }
    ]);

    try {
      const ocrLang = language === 'hi-IN' ? 'eng+hin' : 'eng';
      const { data: { text } } = await Tesseract.recognize(
        file,
        ocrLang,
        { logger: m => console.log(m) } // Optional: log progress
      );

      setIsUploading(false);

      if (!text || text.trim() === '') {
        const noTextMsg = language === 'hi-IN'
          ? "क्षमा करें, मैं छवि से कोई पाठ नहीं निकाल सका। कृपया सुनिश्चित करें कि छवि में स्पष्ट रूप से पठनीय पाठ है।"
          : "Sorry, I couldn't extract any text from the image. Please ensure the image contains clear, readable text.";
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: noTextMsg }
        ]);
        setIsTyping(false);
        return;
      }

      // Automatically send the extracted text as a prompt
      const promptText = `Here is my medical report. Can you summarize it and recommend a doctor based on this? Report contents:\n\n${text}`;
      
      // Remove the "Analyzing..." message
      setMessages((prev) => prev.slice(0, -1));
      
      const displayMsg = language === 'hi-IN'
        ? `अपलोड की गई मेडिकल रिपोर्ट (${file.name})`
        : `Uploaded Medical Report (${file.name})`;

      handleSend(promptText, displayMsg);

    } catch (error) {
      console.error('Tesseract OCR error:', error);
      setIsUploading(false);
      setIsTyping(false);
      // Remove the "Analyzing..." message
      setMessages((prev) => prev.slice(0, -1));
      
      const errorMsg = language === 'hi-IN'
        ? "क्षमा करें, आपकी छवि को संसाधित करने में कोई त्रुटि हुई। कृपया पुन: प्रयास करें।"
        : "Sorry, there was an error processing your image. Please try again.";
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: errorMsg }
      ]);
    }
  };

  const handleSend = async (text, displayMessage = null) => {
    if (!text.trim()) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    // Append user message
    const userMsg = { sender: 'usr', text: displayMessage || text };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const response = await fetch('/webhook/doctor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      const data = await response.json();
      setIsTyping(false);

      if (data.success) {
        if (data.session_id) {
          setSessionId(data.session_id);
        }

        const botMsg = {
          sender: 'bot',
          text: data.message || (data.type === 'doctor_match' ? (language === 'hi-IN' ? 'मैंने आपके अनुरोध का विश्लेषण किया है और निम्नलिखित मिलान वाले डॉक्टर को पाया है:' : 'I have analyzed your request and found the following matched doctor:') : ''),
          card: data.card,
          quickReplies: data.type === 'doctor_match' ? [(language === 'hi-IN' ? "नई खोज शुरू करें" : "Start a new search")] : [],
          audio: data.audio
        };

        setMessages((prev) => [...prev, botMsg]);

        if (isSpeakerOn) {
          speakText(botMsg.text || 'Match completed', data.audio);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.message || "I encountered an issue matching you. Let's try again."
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "Sorry, I'm having trouble connecting to the medical search network. Please ensure the workspace backend has secrets configured and try again."
        }
      ]);
    }
  };

  const handleQuickReply = (text) => {
    if (text === "Start a new search") {
      setSessionId(null);
      setMessages((prev) => [
        ...prev,
        { sender: 'usr', text: "Start a new search" },
        {
          sender: 'bot',
          text: "Let's start fresh! 🩺 Tell me about your medical concern or symptoms."
        }
      ]);
    } else {
      handleSend(text);
    }
  };

  const RobotIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#FF6B00" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6 3h6v2H9v-2z" />
    </svg>
  );

  return (
    <>
      {/* CHAT BUBBLE */}
      <button 
        id="chat-bubble" 
        onClick={toggleChat} 
        title="Chat with VitaCard"
      >
        {showNotification && <div className="chat-notif">1</div>}
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </button>

      {/* CHAT WINDOW */}
      <div id="chat-win" className={isOpen ? 'open' : ''}>
        <div className="chat-head">
          <div className="chat-ava">
            <svg viewBox="0 0 36 36" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="8" fill="#FF6B00" fillOpacity="0.25" />
              <path d="M18 26s-9-5.5-9-11.5A5.5 5.5 0 0 1 18 10.5 5.5 5.5 0 0 1 27 14.5c0 6-9 11.5-9 11.5z" fill="#FF6B00" />
              <path d="M10 18h3l2-4 3 8 2-5 2 3h4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="chat-title">VitaCard AI Matcher</div>
            <div className="chat-status">
              <span className="dot-online"></span> Always here to help
            </div>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select 
              className="chat-lang-select" 
              value={language} 
              onChange={(e) => {
                setLanguage(e.target.value);
                if (audioRef.current) audioRef.current.pause();
                window.speechSynthesis.cancel();
              }}
            >
              <option value="en-IN">EN</option>
              <option value="hi-IN">हिंदी</option>
            </select>

            <button 
              className={`chat-spk-toggle ${isSpeakerOn ? 'on' : 'off'}`}
              onClick={() => {
                const nextVal = !isSpeakerOn;
                setIsSpeakerOn(nextVal);
                if (!nextVal) {
                  if (audioRef.current) audioRef.current.pause();
                  window.speechSynthesis.cancel();
                }
              }}
              title={isSpeakerOn ? "Mute voice output" : "Enable voice output"}
            >
              {isSpeakerOn ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              )}
            </button>

            <button id="chat-x" onClick={() => setIsOpen(false)} style={{ margin: 0 }}>✕</button>
          </div>
        </div>

        <div className="chat-msgs" id="chat-msgs">
          {messages.map((msg, index) => (
            <div key={index} className={`cmsg ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="cmsg-ava" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                  <RobotIcon />
                </div>
              )}
              <div style={{ maxWidth: '85%' }}>
                {msg.text && (
                  <div>
                    <div className="cmsg-bubble">{msg.text}</div>
                    {msg.sender === 'bot' && (
                      <button 
                        className="cmsg-speak-btn"
                        onClick={() => speakText(msg.text, msg.audio)}
                        title="Replay Voice"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {msg.card && msg.card.type === 'question_card' && (
                  <QuestionProgressCard card={msg.card} />
                )}
                
                {msg.card && msg.card.type === 'doctor_card' && (
                  <DoctorMatchCard card={msg.card} language={language} onLinkClick={() => setIsOpen(false)} />
                )}

                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="qrs">
                    {msg.quickReplies.map((qr, qrIdx) => (
                      <button 
                        key={qrIdx} 
                        className="qr" 
                        onClick={() => handleQuickReply(qr)}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="cmsg bot" id="typing-wrap">
              <div className="cmsg-ava" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
                <RobotIcon />
              </div>
              <div 
                className="cmsg-bubble" 
                style={{
                  padding: 0,
                  background: '#261610',
                  border: '1px solid rgba(255,107,0,0.15)',
                  borderBottomLeftRadius: '4px'
                }}
              >
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={msgsEndRef} />
        </div>

        <div className="chat-foot">
          <input 
            id="chat-inp" 
            type="text" 
            placeholder="Ask anything…" 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputVal);
            }}
            autoComplete="off"
            disabled={isUploading}
          />

          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImageUpload} 
          />

          <button 
            id="chat-upload" 
            onClick={() => fileInputRef.current.click()}
            title="Upload Medical Report"
            disabled={isUploading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7l3.5-4.5 2.5 3.01L14.5 11l2.5 6z" />
            </svg>
          </button>

          <button 
            id="chat-mic" 
            className={isRecording ? 'recording' : ''} 
            onClick={handleMicClick}
            title={isRecording ? "Stop recording voice" : "Record voice input"}
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            )}
          </button>

          <button id="chat-snd" onClick={() => handleSend(inputVal)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
