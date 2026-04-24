import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaRobot, FaTimes, FaCommentMedical, FaPaperPlane, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { processChatMessage } from '../../services/aiService';
import { useTranslation } from 'react-i18next';

// ─── Web Speech API helpers ────────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;
const hasSpeechSynthesis = 'speechSynthesis' in window;

const ChatAssistant = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // ─── Privacy Guard: Scoped Storage Keys ───
  const userId = user?.id || 'anon';
  const msgKey = `chat_messages_${userId}`;
  const ttsKey = `chat_tts_enabled_${userId}`;

  // ─── Voice state ───
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem(ttsKey);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const recognitionRef = useRef(null);
  
  // Get active language from i18n or storage
  const currentLangCode = i18n.language || localStorage.getItem('careplus_lang') || 'en';
  const isTr = currentLangCode.startsWith('tr');

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(msgKey);
    return saved ? JSON.parse(saved) : [{ 
      sender: 'bot', 
      text: t('chatbot.greeting', "Hi there! I'm your CarePlus AI Assistant. How can I help you today?") 
    }];
  });

  const messagesEndRef = useRef(null);

  // ─── User Isolation Logic ───
  // If the User ID changes, re-fetch the correct history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(msgKey);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{ 
        sender: 'bot', 
        text: t('chatbot.greeting', "Hi there! I'm your CarePlus AI Assistant. How can I help you today?") 
      }]);
    }

    const savedTTS = localStorage.getItem(ttsKey);
    setTtsEnabled(savedTTS !== null ? JSON.parse(savedTTS) : true);
    
    // Safety: Close chat and stop speech if user swapped
    setIsOpen(false);
    if (hasSpeechSynthesis) window.speechSynthesis.cancel();
  }, [userId, msgKey, ttsKey, t]);

  // ─── Helper: Scroll to bottom ───
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen, scrollToBottom]);

  // Sync messages to localStorage (User-scoped)
  useEffect(() => {
    if (userId !== 'anon') {
      localStorage.setItem(msgKey, JSON.stringify(messages));
    }
  }, [messages, msgKey, userId]);

  // Persist TTS preference (User-scoped)
  useEffect(() => {
    if (userId !== 'anon') {
      localStorage.setItem(ttsKey, JSON.stringify(ttsEnabled));
    }
  }, [ttsEnabled, ttsKey, userId]);

  // ─── Text-to-Speech ───
  const speakText = useCallback((text) => {
    if (!hasSpeechSynthesis || !ttsEnabled) return;
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[•\-\*]\s/gm, '')
      .replace(/#{1,6}\s/g, '')
      .trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.lang = isTr ? 'tr-TR' : 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [isTr, ttsEnabled]);

  // ─── Send logic ───
  const handleSendCore = useCallback(async (displayMsg) => {
    if (!displayMsg) return;

    setMessages(prev => [...prev, { sender: 'user', text: displayMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await processChatMessage(null, displayMsg, null);
      setTimeout(() => {
        setIsTyping(false);
        const botText = response.text;
        setMessages(prev => [...prev, { sender: 'bot', text: botText }]);
        speakText(botText);
      }, 500);
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: 'I encountered an error connecting to my brain. Please try again.' }]);
    }
  }, [speakText]);

  const handleSend = useCallback(async () => {
    await handleSendCore(input.trim());
  }, [input, handleSendCore]);

  const handleSendVoice = useCallback(async (transcript) => {
    await handleSendCore(transcript.trim());
  }, [handleSendCore]);

  // ─── Speech Recognition setup ───
  useEffect(() => {
    if (!hasSpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = isTr ? 'tr-TR' : 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => {
        setInput('');
        handleSendVoice(transcript);
      }, 400);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [isTr, handleSendVoice]);

  // Stop speech when closed
  useEffect(() => {
    if (!isOpen && hasSpeechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      if (hasSpeechSynthesis) window.speechSynthesis.cancel();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start failed:', e);
      }
    }
  };

  const parseMarkdown = (text) => {
    if (!text) return '';
    let html = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/^\* (.*$)/gim, '• $1');
    return html;
  };

  const pulseKeyframes = `
    @keyframes micPulse {
      0%   { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.5); }
      70%  { box-shadow: 0 0 0 12px rgba(220, 53, 69, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
    }
  `;

  return (
    <>
      <style>{pulseKeyframes}</style>
      {!isOpen && (
        <Button 
          variant="primary" 
          className="rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 position-fixed"
          style={{ width: '60px', height: '60px', bottom: '30px', right: '30px', zIndex: 1050 }}
          onClick={() => setIsOpen(true)}
        >
          <FaCommentMedical size={26} />
        </Button>
      )}

      {isOpen && (
        <Card 
          className="position-fixed shadow border-0 overflow-hidden animate-fade-in" 
          style={{ width: '380px', height: '600px', bottom: '30px', right: '30px', zIndex: 1050, borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}
        >
          <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center flex-shrink-0">
            <div className="d-flex align-items-center">
              <div className="bg-white text-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <FaRobot />
              </div>
              <div>
                <h6 className="mb-0 fw-bold">{t('chatbot.title', 'CarePlus Assistant')}</h6>
                <small className="opacity-75" style={{ fontSize: '0.72rem' }}>{t('chatbot.subtitle', 'AI Virtual Receptionist')}</small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <OverlayTrigger placement="bottom" overlay={<Tooltip>{t('chatbot.reset', 'Reset chat')}</Tooltip>}>
                <Button
                  variant="link"
                  className="text-white p-0 shadow-none d-flex align-items-center justify-content-center opacity-75"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => {
                    if (window.confirm(t('chatbot.confirm_reset', 'Clear chat history?'))) {
                      setMessages([{ sender: 'bot', text: t('chatbot.greeting', "Hi there! I'm your CarePlus AI Assistant. How can I help you today?") }]);
                      localStorage.removeItem(msgKey);
                    }
                  }}
                >
                  <FaTimes size={14} style={{ transform: 'rotate(45deg)' }} />
                </Button>
              </OverlayTrigger>

              {hasSpeechSynthesis && (
                <OverlayTrigger placement="bottom" overlay={<Tooltip>{ttsEnabled ? 'Mute voice' : 'Enable voice'}</Tooltip>}>
                  <Button
                    variant="link"
                    className="text-white p-0 shadow-none d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px', opacity: ttsEnabled ? 1 : 0.5 }}
                    onClick={() => {
                      if (ttsEnabled) window.speechSynthesis.cancel();
                      setTtsEnabled(prev => !prev);
                    }}
                  >
                    {ttsEnabled ? <FaVolumeUp size={16} /> : <FaVolumeMute size={16} />}
                  </Button>
                </OverlayTrigger>
              )}
              <Button variant="link" className="text-white p-0 opacity-75 shadow-none" onClick={() => setIsOpen(false)}>
                <FaTimes size={20} />
              </Button>
            </div>
          </div>

          <Card.Body className="bg-light p-3 flex-grow-1 overflow-auto d-flex flex-column gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                <div 
                  className={`p-3 shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                  style={{ 
                      maxWidth: '85%', 
                      borderRadius: '1rem',
                      borderBottomRightRadius: msg.sender === 'user' ? '0' : '1rem',
                      borderBottomLeftRadius: msg.sender === 'bot' ? '0' : '1rem',
                      whiteSpace: 'pre-line' 
                  }}
                  dangerouslySetInnerHTML={msg.sender === 'bot' ? { __html: parseMarkdown(msg.text) } : { __html: msg.text }}
                />
              </div>
            ))}
            {isListening && (
              <div className="d-flex align-items-start">
                <div className="bg-white p-3 shadow-sm d-flex align-items-center gap-2" style={{ borderRadius: '1rem', borderBottomLeftRadius: '0' }}>
                  <FaMicrophone className="text-danger" style={{ animation: 'micPulse 1.2s infinite' }} />
                  <small className="text-muted fst-italic">{t('chatbot.listening', 'Listening...')}</small>
                </div>
              </div>
            )}
            {isTyping && (
              <div className="d-flex align-items-start">
                <div className="bg-white p-3 shadow-sm d-flex align-items-center gap-1" style={{ borderRadius: '1rem', borderBottomLeftRadius: '0' }}>
                  <div className="spinner-grow spinner-grow-sm text-primary opacity-50" style={{ width: '0.5rem', height: '0.5rem' }}></div>
                  <div className="spinner-grow spinner-grow-sm text-primary opacity-75" style={{ width: '0.5rem', height: '0.5rem', animationDelay: '0.2s' }}></div>
                  <div className="spinner-grow spinner-grow-sm text-primary" style={{ width: '0.5rem', height: '0.5rem', animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </Card.Body>

          <Card.Footer className="bg-white border-top p-3 flex-shrink-0">
            <Form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
              <InputGroup className="bg-light rounded-pill border overflow-hidden">
                {hasSpeechRecognition && (
                  <OverlayTrigger placement="top" overlay={<Tooltip>{isListening ? 'Stop' : 'Mikrofon'}</Tooltip>}>
                    <Button
                      type="button"
                      variant={isListening ? 'danger' : 'primary'}
                      className="d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                      style={{ width: '42px', height: '42px', minWidth: '42px', borderRadius: '50%', margin: '2px', transition: 'all 0.2s ease', border: 'none', ...(isListening ? { animation: 'micPulse 1.2s infinite' } : {}) }}
                      onClick={toggleListening}
                      disabled={isTyping}
                    >
                      {isListening ? <FaMicrophoneSlash size={18} className="text-white" /> : <FaMicrophone size={18} className="text-white" />}
                    </Button>
                  </OverlayTrigger>
                )}
                <Form.Control
                  type="text"
                  placeholder={isListening ? t('chatbot.speak_now', 'Speak now...') : t('chatbot.placeholder', 'Type a message...')}
                  className="bg-transparent border-0 shadow-none ps-2 py-2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isListening}
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  className="rounded-circle m-1 p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '38px', height: '38px' }}
                  disabled={!input.trim() || isListening}
                >
                  <FaPaperPlane size={14} className="ms-1" />
                </Button>
              </InputGroup>
            </Form>
            {!hasSpeechRecognition && (
              <small className="text-muted d-block text-center mt-1" style={{ fontSize: '0.65rem' }}>{t('chatbot.no_mic_support', 'Voice input not supported in this browser.')}</small>
            )}
          </Card.Footer>
        </Card>
      )}
    </>
  );
};

export default ChatAssistant;
