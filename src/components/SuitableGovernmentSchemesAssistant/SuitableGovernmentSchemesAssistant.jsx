import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Landmark,
  X,
  Send,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Building2,
  Droplets,
  Home,
  Wheat,
  Route,
  HeartPulse,
  GraduationCap,
  Trash2,
  Sun,
  Briefcase,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileCheck,
  FileText,
  CheckCircle2,
  Info,
  Award,
  TrendingUp,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { QUICK_QUESTIONS, INITIAL_GREETING } from './schemeAssistantData';
import { querySchemeAssistant } from './schemeAssistantService';

// Icon mapper for quick categories and scheme badges
const getCategoryIcon = (iconName) => {
  switch (iconName) {
    case 'Droplets':
      return Droplets;
    case 'Home':
      return Home;
    case 'Wheat':
      return Wheat;
    case 'Route':
      return Route;
    case 'HeartPulse':
      return HeartPulse;
    case 'GraduationCap':
      return GraduationCap;
    case 'Trash2':
      return Trash2;
    case 'Sun':
      return Sun;
    case 'Briefcase':
      return Briefcase;
    default:
      return Landmark;
  }
};

/**
 * Format markdown-like text with bolding, lists, and links.
 */
function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split by double newline into paragraphs / blocks
  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[var(--text-main)] font-sans">
      {paragraphs.map((para, pIdx) => {
        // Headers (### or ####)
        if (para.startsWith('### ')) {
          return (
            <h4 key={pIdx} className="text-xs sm:text-sm font-black text-emerald-500 dark:text-emerald-400 pt-1 flex items-center gap-1.5">
              {para.replace('### ', '')}
            </h4>
          );
        }
        if (para.startsWith('#### ')) {
          return (
            <h5 key={pIdx} className="text-[11px] font-extrabold text-[var(--text-main)] uppercase tracking-wider pt-1">
              {para.replace('#### ', '')}
            </h5>
          );
        }

        // Horizontal rule
        if (para.trim() === '---') {
          return <hr key={pIdx} className="border-[var(--border-subtle)] my-2" />;
        }

        // Callout notes
        if (para.includes('> [!NOTE]') || para.startsWith('>')) {
          const cleanText = para
            .replace('> [!NOTE]', '')
            .replace(/^>\s*/gm, '')
            .trim();
          return (
            <div
              key={pIdx}
              className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-[var(--text-muted)] flex items-start gap-2"
            >
              <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>{renderFormattedInlineText(cleanText)}</div>
            </div>
          );
        }

        // Bulleted lists
        if (para.includes('\n• ') || para.startsWith('• ') || para.includes('\n- ') || para.startsWith('- ')) {
          const lines = para.split('\n');
          return (
            <ul key={pIdx} className="space-y-1 pl-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                if (!cleanLine) return null;
                return (
                  <li key={lIdx} className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{renderFormattedInlineText(cleanLine)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={pIdx} className="text-[11px] text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
            {renderFormattedInlineText(para)}
          </p>
        );
      })}
    </div>
  );
}

MarkdownRenderer.propTypes = {
  content: PropTypes.string,
};

/**
 * Helper to render inline **bold**, *italic*, and [link](url) safely.
 */
function renderFormattedInlineText(text) {
  if (!text) return '';

  // Regex to match markdown links [text](url) and **bold**
  const tokens = [];
  const linkRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }
    tokens.push({ type: 'link', label: match[1], url: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.map((token, tIdx) => {
    if (typeof token === 'object' && token.type === 'link') {
      return (
        <a
          key={tIdx}
          href={token.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-500 hover:text-emerald-400 font-bold underline inline-flex items-center gap-0.5"
        >
          <span>{token.label}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      );
    }

    // Parse **bold**
    const parts = token.split(/(\*\*.*?\*\*)/g);
    return (
      <React.Fragment key={tIdx}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-[var(--text-main)]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </React.Fragment>
    );
  });
}

/**
 * Interactive Scheme Result Card displayed in chat.
 */
function SchemeCard({ scheme, location }) {
  const { activePalette } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!scheme) return null;

  const portalUrl = scheme.official_portal_url || 'https://rural.gov.in/';
  let hostname = 'gov.in';
  try {
    hostname = new URL(portalUrl).hostname;
  } catch (e) {
    hostname = 'gov.in';
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-emerald-500/40 rounded-2xl p-3.5 shadow-lg space-y-3 transition-all duration-200">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
            style={{ backgroundColor: `${activePalette.primary}25`, color: activePalette.primary }}
          >
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-[var(--text-main)] leading-snug">
              {scheme.scheme_name}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-medium mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{scheme.ministry || 'Government of India'}</span>
            </p>
          </div>
        </div>

        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
          {scheme.category || 'Central Scheme'}
        </span>
      </div>

      {/* Purpose / Why Relevant */}
      <div className="space-y-1 text-[11px] bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Why Relevant to {location?.gp_name || 'Village'}</span>
        </div>
        <p className="text-[var(--text-main)] text-[11px] leading-relaxed">
          {scheme.why_relevant || scheme.why_relevant_template || scheme.purpose}
        </p>
      </div>

      {/* Eligibility & Benefits Summary */}
      <div className="space-y-1.5 text-[11px]">
        {scheme.eligibility_criteria && (
          <div className="flex items-start gap-1.5 text-[10.5px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--text-main)]">Eligibility: </span>
              <span className="text-[var(--text-muted)]">{scheme.eligibility_criteria}</span>
            </div>
          </div>
        )}

        {scheme.key_benefits && Array.isArray(scheme.key_benefits) && (
          <div className="pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Key Provisions:
            </span>
            <ul className="space-y-0.5 pl-1">
              {scheme.key_benefits.slice(0, 2).map((b, bIdx) => (
                <li key={bIdx} className="flex items-start gap-1 text-[10.5px] text-[var(--text-muted)]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Expandable Details (Documents & Application Steps) */}
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)] animate-fadeIn text-[11px]">
          {scheme.required_documents && Array.isArray(scheme.required_documents) && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 mb-1">
                <FileCheck className="w-3 h-3 text-slate-400" />
                Required Documents:
              </span>
              <ul className="space-y-0.5 pl-1">
                {scheme.required_documents.map((d, dIdx) => (
                  <li key={dIdx} className="text-[10.5px] text-[var(--text-muted)] flex items-start gap-1">
                    <span className="text-emerald-500">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scheme.application_process && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3 text-slate-400" />
                Application Process:
              </span>
              <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-subtle)]">
                {scheme.application_process}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Card Action Controls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Less Info' : 'View Documents & Steps'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <span>Official Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

SchemeCard.propTypes = {
  scheme: PropTypes.object.isRequired,
  location: PropTypes.object,
};

/**
 * Main Suitable Government Schemes Assistant Component.
 */
export default function SuitableGovernmentSchemesAssistant({
  isOpen,
  onClose,
  onToggle,
  onNavigateToPrediction,
  hideFloatingTrigger = false,
}) {
  const { user } = useAuth();
  const { selectedLocation, planningHorizon, setActiveTab } = useLocation();
  const { activePalette } = useTheme();

  const handleGoToPrediction = useCallback(
    (mode = 'selected') => {
      if (onClose) onClose();
      if (onNavigateToPrediction) {
        onNavigateToPrediction(mode);
      } else if (setActiveTab) {
        setActiveTab('prediction');
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [onClose, onNavigateToPrediction, setActiveTab]
  );

  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize conversation when assistant is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initConversation();
    }
  }, [isOpen, selectedLocation?.gp_id]);

  const initConversation = () => {
    setMessages([
      {
        ...INITIAL_GREETING,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendQuery = async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    const trimmed = queryText.trim();
    setTextInput('');

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Build location payload
      const locPayload = {
        gp_id: selectedLocation?.gp_id || 101,
        gp_name: selectedLocation?.gp_name || 'Koduvai',
        district: selectedLocation?.district || 'Tiruppur',
        state: selectedLocation?.state || 'Tamil Nadu',
        population: selectedLocation?.population || 5800,
        planning_horizon: planningHorizon || 5,
      };

      const chatHistory = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await querySchemeAssistant(trimmed, locPayload, chatHistory);

      setIsTyping(false);
      const botMsg = {
        id: `scheme-bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply || 'Information retrieved according to official government norms.',
        schemes: res.schemes || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error in scheme assistant query:', err);
      setIsTyping(false);

      const botMsg = {
        id: `scheme-bot-error-${Date.now()}`,
        sender: 'bot',
        text: `Thank you for your query regarding **${selectedLocation?.gp_name || 'your Gram Panchayat'}**.
You can explore official Central & State schemes on [india.gov.in](https://www.india.gov.in/) or [rural.gov.in](https://rural.gov.in/).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendQuery(textInput);
  };

  // Floating Trigger Buttons Dock (when closed)
  if (!isOpen) {
    if (hideFloatingTrigger) return null;

    return (
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[1090] flex flex-col sm:flex-row items-end sm:items-center gap-2.5 sm:gap-3 pointer-events-none">
        {/* Future Prediction Floating Trigger Button */}
        <button
          type="button"
          onClick={() => handleGoToPrediction('selected')}
          className="pointer-events-auto group flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-indigo-700 via-purple-600 to-teal-500 hover:from-indigo-600 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-950/80 ring-2 ring-indigo-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Open 5-Year Village Future Development & Infrastructure Prediction"
        >
          <div className="relative">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-100" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <span className="hidden sm:inline font-black tracking-tight">Future Prediction</span>
          <span className="sm:hidden font-black">Prediction</span>
        </button>

        {/* Suitable Government Schemes Floating Trigger Button */}
        <button
          type="button"
          onClick={onToggle}
          className="pointer-events-auto group flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-500 hover:from-teal-600 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-teal-950/80 ring-2 ring-teal-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Suitable Government Schemes AI Assistant"
        >
          <div className="relative">
            <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          </div>
          <span className="hidden sm:inline font-black tracking-tight">Suitable Government Schemes</span>
          <span className="sm:hidden font-black">Govt Schemes</span>
        </button>
      </div>
    );
  }

  // Expanded Interactive Chatbot Window
  return (
    <div
      className={`fixed bottom-6 right-4 sm:right-6 z-[1105] w-[94vw] sm:w-[460px] bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-strong)] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-slideUp ${
        isMinimized ? 'h-[64px]' : 'max-h-[660px] h-[84vh]'
      }`}
    >
      {/* 1. Header Bar */}
      <div className="bg-[var(--bg-card-hover)] px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-cyan-400 border border-emerald-400/40 flex items-center justify-center text-white shadow-md shadow-teal-950/50 ring-2 ring-emerald-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-[var(--text-main)] leading-tight">
                Suitable Government Schemes
              </h3>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                RAG AI
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[220px]">
              Location: {selectedLocation?.gp_name || 'Village'} GP ({selectedLocation?.state || 'India'})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => handleGoToPrediction('selected')}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95 mr-1"
            title="Open 5-Year Future Prediction"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Future Prediction</span>
          </button>
          <button
            type="button"
            onClick={initConversation}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* 2. Messages Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-primary)]">
            {/* Quick Question Chips Banner */}
            <div className="space-y-1.5 pb-1 border-b border-[var(--border-subtle)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Quick Scheme Inquiries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => {
                  const IconComp = getCategoryIcon(q.icon);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSendQuery(q.query)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${q.bg}`}
                    >
                      <IconComp className="w-3 h-3" />
                      <span>{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rendered Messages */}
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end animate-fadeIn">
                    <div className="max-w-[85%] bg-gradient-to-r from-teal-700 to-emerald-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-medium shadow-md">
                      <p>{msg.text}</p>
                      <span className="text-[9px] opacity-75 block text-right mt-1">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="space-y-3 max-w-full animate-fadeIn">
                  {/* Bot Text Message Bubble */}
                  <div className="max-w-[94%] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm p-3.5 shadow-md space-y-2">
                    <MarkdownRenderer content={msg.text} />
                    <span className="text-[9px] text-[var(--text-muted)] block text-left pt-1">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Inline Scheme Result Cards */}
                  {msg.schemes && msg.schemes.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Award className="w-3.5 h-3.5" />
                        <span>Recommended Scheme Cards:</span>
                      </div>
                      {msg.schemes.map((scheme, sIdx) => (
                        <SchemeCard key={scheme.scheme_id || sIdx} scheme={scheme} location={selectedLocation} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl w-56 animate-fadeIn">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  Retrieving scheme rules...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Bridge to Future Prediction */}
          <div className="px-3.5 py-2 bg-[var(--bg-card-hover)] border-t border-[var(--border-subtle)] flex items-center justify-between text-xs flex-shrink-0">
            <span className="text-[11px] text-[var(--text-muted)] font-medium truncate flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>5-Year Village Development Forecast:</span>
            </span>
            <button
              type="button"
              onClick={() => handleGoToPrediction('selected')}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95 flex-shrink-0"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Future Prediction</span>
            </button>
          </div>

          {/* 3. Text Query Input Footer */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Ask about schemes for ${selectedLocation?.gp_name || 'your village'}...`}
              className="flex-1 px-3.5 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isTyping}
              className="p-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 cursor-pointer"
              title="Send Inquiry"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

SuitableGovernmentSchemesAssistant.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onNavigateToPrediction: PropTypes.func,
  hideFloatingTrigger: PropTypes.bool,
};
