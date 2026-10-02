import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Bot,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Minimize2,
  Maximize2,
  ChevronRight,
  Shield,
  Building2,
  Droplets,
  GraduationCap,
  Route,
  Trash2,
  Loader2,
  TrendingUp,
  MapPin,
  Sliders,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sendChatMessage } from '../services/api';

const GUIDED_QUESTIONS = [
  {
    id: 'water',
    title: 'Drinking Water Availability',
    question: 'What is the current drinking water availability in your ward/village?',
    icon: Droplets,
    options: [
      { label: '< 2 Hours / Day (Critical Deficit)', value: 'critical', score: 1 },
      { label: '2 - 4 Hours / Day (Moderate Gap)', value: 'moderate', score: 2 },
      { label: '4 - 8 Hours / Day (Adequate)', value: 'adequate', score: 3 },
      { label: '24/7 Piped Supply (JJM Covered)', value: 'optimal', score: 4 },
    ],
  },
  {
    id: 'education',
    title: 'School Classroom Infrastructure',
    question: 'How many functional school classrooms are available for local children?',
    icon: GraduationCap,
    options: [
      { label: 'Severe Shortage (< 10 classrooms)', value: 'critical', score: 1 },
      { label: 'Moderate Gap (12 - 20 classrooms)', value: 'moderate', score: 2 },
      { label: 'Adequate (25 - 35 classrooms)', value: 'adequate', score: 3 },
      { label: 'Surplus / Smart Classrooms (40+)', value: 'optimal', score: 4 },
    ],
  },
  {
    id: 'roads',
    title: 'Road & Transport Connectivity',
    question: 'What is the condition of paved / all-weather roads connecting your village?',
    icon: Route,
    options: [
      { label: 'Unpaved Mud Tracks / Cut-off in Monsoons', value: 'critical', score: 1 },
      { label: 'Partial Bitumen Roads (< 15 km)', value: 'moderate', score: 2 },
      { label: 'Good Connectivity (20 - 35 km)', value: 'adequate', score: 3 },
      { label: '100% All-Weather PMGSY Concrete Network', value: 'optimal', score: 4 },
    ],
  },
  {
    id: 'sanitation',
    title: 'Sanitation & Solid Waste Management',
    question: 'Are there frequent sanitation overflows or waste collection issues in your ward?',
    icon: Trash2,
    options: [
      { label: 'Frequent Drain Overflows & No Waste Pickup', value: 'critical', score: 1 },
      { label: 'Irregular Weekly Collection / Partial Drains', value: 'moderate', score: 2 },
      { label: 'Regular Bi-Weekly Waste Collection', value: 'adequate', score: 3 },
      { label: '100% Segregated ODF+ Bio-Composting Facility', value: 'optimal', score: 4 },
    ],
  },
];

export default function VillageChatbot({ isOpen, onClose, onToggle, onNavigateToPrediction }) {
  const { user } = useAuth();
  const { selectedLocation, planningHorizon, setActiveTab } = useLocation();
  const { activePalette } = useTheme();

  const [showPredictionSlides, setShowPredictionSlides] = useState(false);

  const handleGoToPrediction = (mode = 'selected') => {
    setShowPredictionSlides(false);
    if (onClose) onClose();
    if (onNavigateToPrediction) {
      onNavigateToPrediction(mode);
    } else if (setActiveTab) {
      setActiveTab('prediction');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [messages, setMessages] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [isApplied, setIsApplied] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize guided conversation when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initConversation();
    }
  }, [isOpen, selectedLocation?.gp_id]);

  const initConversation = () => {
    setCurrentStepIndex(0);
    setUserAnswers({});
    setAssessmentResult(null);
    setIsApplied(false);

    const initialMessages = [
      {
        id: 'init-1',
        sender: 'bot',
        text: `Namaste ${user?.name || 'Citizen'}! 🙏 I am your **GramPulse AI Governance Assistant** for **${selectedLocation?.gp_name || 'your Gram Panchayat'} Gram Panchayat**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'init-2',
        sender: 'bot',
        text: `I will guide you through a 4-step infrastructure evaluation to identify real-time deficits for the **${new Date().getFullYear() + planningHorizon} GPDP Plan**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'q-0',
        sender: 'bot',
        isQuestion: true,
        stepIndex: 0,
        questionData: GUIDED_QUESTIONS[0],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(initialMessages);
  };

  const handleOptionSelect = (questionIndex, selectedOption) => {
    const question = GUIDED_QUESTIONS[questionIndex];
    const newAnswers = { ...userAnswers, [question.id]: selectedOption };
    setUserAnswers(newAnswers);

    // Add user response message
    const userMsg = {
      id: `ans-${question.id}-${Date.now()}`,
      sender: 'user',
      text: selectedOption.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const nextIndex = questionIndex + 1;

      if (nextIndex < GUIDED_QUESTIONS.length) {
        // Post next question
        setCurrentStepIndex(nextIndex);
        const nextQMsg = {
          id: `q-${nextIndex}`,
          sender: 'bot',
          isQuestion: true,
          stepIndex: nextIndex,
          questionData: GUIDED_QUESTIONS[nextIndex],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, nextQMsg]);
      } else {
        // Generate AI synthesis report
        generateAssessmentReport(newAnswers);
      }
    }, 600);
  };

  const generateAssessmentReport = (answers) => {
    const pop = Number(selectedLocation?.population || 5800);
    const popProj = Math.round(pop * (1 + (planningHorizon * 0.018)));

    const waterScore = answers.water?.score || 2;
    const eduScore = answers.education?.score || 2;
    const roadScore = answers.roads?.score || 2;
    const sanitScore = answers.sanitation?.score || 2;

    const waterDeficitLpd = waterScore <= 2 ? Math.round(popProj * 25) : 0;
    const classroomDeficit = eduScore <= 2 ? Math.max(2, Math.ceil((popProj * 0.18) / 30) - (selectedLocation?.school_classrooms_count || 28)) : 0;
    const roadDeficitKm = roadScore <= 2 ? Number((((popProj / 1000) * 1.25) - (selectedLocation?.road_coverage_km || 6.2)).toFixed(1)) : 0;

    const report = {
      villageName: selectedLocation?.gp_name || 'Active Habitation',
      targetYear: new Date().getFullYear() + planningHorizon,
      populationProjected: popProj,
      water: {
        score: waterScore,
        deficitLpd: waterDeficitLpd,
        recommendation: waterDeficitLpd > 0 ? 'Augment 3 community borewells + overhead reservoir (JJM Scheme)' : 'Optimal distribution under Har Ghar Jal',
        estimatedBudgetLakhs: waterDeficitLpd > 0 ? 32.5 : 0,
      },
      education: {
        score: eduScore,
        classroomDeficit: classroomDeficit,
        recommendation: classroomDeficit > 0 ? `Construct ${classroomDeficit} Smart Classrooms + STEM Lab (PM SHRI Scheme)` : 'Classroom to pupil ratio within RTE limits',
        estimatedBudgetLakhs: classroomDeficit > 0 ? Number((classroomDeficit * 6.5).toFixed(1)) : 0,
      },
      roads: {
        score: roadScore,
        roadDeficitKm: Math.max(0, roadDeficitKm),
        recommendation: roadDeficitKm > 0 ? `Pave ${roadDeficitKm} km all-weather Bitumen arterial road (PMGSY Scheme)` : 'Paved road connectivity meets national target',
        estimatedBudgetLakhs: roadDeficitKm > 0 ? Number((roadDeficitKm * 18.0).toFixed(1)) : 0,
      },
    };

    setAssessmentResult(report);

    const reportMsg = {
      id: `report-${Date.now()}`,
      sender: 'bot',
      isReport: true,
      reportData: report,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, reportMsg]);
  };

  const handleApplyToGPDP = () => {
    setIsApplied(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput.trim();
    setTextInput('');

    const userMsg = {
      id: `custom-user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(
        userText,
        selectedLocation.gp_id,
        planningHorizon
      );

      setIsTyping(false);
      const botReply = {
        id: `bot-reply-${Date.now()}`,
        sender: 'bot',
        text: response.reply || response.text || 'Information processed according to MoPR guidelines.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setIsTyping(false);
      const botReply = {
        id: `bot-reply-${Date.now()}`,
        sender: 'bot',
        text: `Thank you for your query regarding **${selectedLocation?.gp_name || 'this Gram Panchayat'}**. Under Jal Jeevan Mission and PMGSY national standards, all deficit metrics and scheme allocations are available in the GPDP PDF plan.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    }
  };

  // Floating Trigger Widget (when closed)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[1100] flex flex-col items-end gap-3.5">
        {/* Floating Dual-Slide Selection Popover for Future Prediction */}
        {showPredictionSlides && (
          <div className="mb-2 w-[340px] sm:w-[380px] bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-5 shadow-2xl shadow-emerald-950/80 ring-2 ring-emerald-500/20 animate-slideUp">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
                    Future Prediction Modes
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Choose how you want to forecast</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPredictionSlides(false)}
                className="w-6 h-6 rounded-full bg-[var(--bg-primary)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 flex items-center justify-center transition-colors text-xs"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Slide 1: Predict for Selected Village */}
              <button
                type="button"
                onClick={() => handleGoToPrediction('selected')}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent hover:from-emerald-500/25 hover:to-teal-500/15 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-200 group flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/30 transition-all">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Predict for Selected Village
                    </h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Live Map GIS
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-300/80 font-medium mt-0.5 truncate">
                    {selectedLocation?.gp_name || 'Active Map Village'} GP ({selectedLocation?.district || 'Coimbatore'})
                  </p>
                  <p className="text-[9.5px] text-[var(--text-muted)] mt-1">
                    Auto-predict using live telemetry and UDISE+ school records
                  </p>
                </div>
              </button>

              {/* Slide 2: Predict for Village Manually */}
              <button
                type="button"
                onClick={() => handleGoToPrediction('manual')}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/15 via-cyan-500/5 to-transparent hover:from-teal-500/25 hover:to-cyan-500/15 border border-teal-500/30 hover:border-teal-400/50 transition-all duration-200 group flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-110 group-hover:bg-teal-500/30 transition-all">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      Predict for Village Manually
                    </h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                      Custom Fields
                    </span>
                  </div>
                  <p className="text-[10px] text-teal-300/80 font-medium mt-0.5">
                    Custom Demographic & Infrastructure Fields
                  </p>
                  <p className="text-[9.5px] text-[var(--text-muted)] mt-1">
                    Enter custom metrics, click predict, and view 5-year simulation
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Floating Quick Action Launcher Dock */}
        <div className="flex items-center gap-2 bg-[var(--bg-card-glass)] backdrop-blur-xl p-1.5 rounded-full border border-[var(--border-strong)] shadow-2xl">
          {/* Quick Action: Future Prediction */}
          <button
            type="button"
            onClick={() => setShowPredictionSlides((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Open 5-Year Village Future Development Prediction"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Future Prediction</span>
          </button>

          {/* Chatbot Trigger */}
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Open GramPulse Village Assessment AI Assistant"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-500" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="hidden sm:inline">Village AI Assistant</span>
          </button>
        </div>
      </div>
    );
  }

  // Expanded Interactive Chatbot Window
  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[1100] w-[92vw] sm:w-[420px] max-h-[640px] h-[82vh] bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-strong)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
      {/* Chatbot Header */}
      <div className="bg-[var(--bg-card-hover)] px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-[var(--text-main)] leading-tight">
                GramPulse Assistant
              </h3>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                MoPR AI
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
              Assessing {selectedLocation?.gp_name || 'Active Gram Panchayat'} GP ({selectedLocation?.state || 'India'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGoToPrediction}
            className="px-2.5 py-1 rounded-xl text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${activePalette.secondary}, ${activePalette.primary})`,
            }}
            title="Open 5-Year Future Prediction"
          >
            <TrendingUp className="w-3 h-3" />
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
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-[var(--bg-primary)]">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[82%] bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-medium shadow-md">
                  <p>{msg.text}</p>
                  <span className="text-[9px] opacity-70 block text-right mt-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          }

          // Guided Question Message Card
          if (msg.isQuestion && msg.questionData) {
            const q = msg.questionData;
            const QIcon = q.icon;
            const answered = userAnswers[q.id] !== undefined;

            return (
              <div key={msg.id} className="space-y-2 max-w-[94%] animate-fadeIn">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <QIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm p-3 shadow-md space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <span>Step {msg.stepIndex + 1} of 4: {q.title}</span>
                    </div>
                    <p className="text-xs font-bold text-[var(--text-main)]">{q.question}</p>

                    {/* Option Choices */}
                    {!answered && (
                      <div className="grid grid-cols-1 gap-1.5 pt-1">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleOptionSelect(msg.stepIndex, opt)}
                            className="w-full text-left p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-emerald-500/10 border border-[var(--border-subtle)] hover:border-emerald-500/40 text-[var(--text-main)] text-[11px] font-medium transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span>{opt.label}</span>
                            <ChevronRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Formatted Assessment Report Card Message
          if (msg.isReport && msg.reportData) {
            const r = msg.reportData;
            return (
              <div key={msg.id} className="space-y-3 max-w-full animate-fadeIn">
                <div className="bg-[var(--bg-card)] border-2 border-emerald-500/40 rounded-2xl p-3.5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Village Need Assessment Summary</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                      Target: {r.targetYear}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                    Ground assessment evaluated for <strong>{r.villageName}</strong> (Proj. Population: {r.populationProjected.toLocaleString()}):
                  </p>

                  <div className="space-y-2 text-[11px]">
                    {/* Water Supply */}
                    <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-main)] flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-cyan-500" /> Water Availability
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            r.water.score <= 2
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          }`}
                        >
                          {r.water.score <= 2 ? 'Deficit Identified' : 'Adequate'}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-[10px]">{r.water.recommendation}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                        Est. Scheme Budget: ₹{r.water.estimatedBudgetLakhs} Lakhs
                      </p>
                    </div>

                    {/* Classrooms */}
                    <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-main)] flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-purple-500" /> Education Infrastructure
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            r.education.classroomDeficit > 0
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          }`}
                        >
                          {r.education.classroomDeficit > 0 ? `Gap: ${r.education.classroomDeficit} Rooms` : 'Sufficient'}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-[10px]">{r.education.recommendation}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                        Est. Scheme Budget: ₹{r.education.estimatedBudgetLakhs} Lakhs
                      </p>
                    </div>

                    {/* Roads */}
                    <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-main)] flex items-center gap-1">
                          <Route className="w-3 h-3 text-orange-500" /> All-Weather Road Connectivity
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            r.roads.roadDeficitKm > 0
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          }`}
                        >
                          {r.roads.roadDeficitKm > 0 ? `Shortage: ${r.roads.roadDeficitKm} km` : '100% Connected'}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-[10px]">{r.roads.recommendation}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                        Est. Scheme Budget: ₹{r.roads.estimatedBudgetLakhs} Lakhs
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Future Prediction & Apply to GPDP */}
                  <div className="flex flex-col gap-2 pt-1">
                    {/* Future Prediction Action Button */}
                    <button
                      type="button"
                      onClick={handleGoToPrediction}
                      className="w-full py-2.5 px-3 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${activePalette.secondary}, ${activePalette.primary})`,
                      }}
                      title="Navigate to 5-Year Village Development Forecast"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Future Prediction</span>
                    </button>

                    {/* Apply to GPDP Plan Action Button */}
                    <button
                      type="button"
                      onClick={handleApplyToGPDP}
                      disabled={isApplied}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-700 text-white cursor-default'
                          : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-main)] active:scale-95'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Applied to GPDP Plan!</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <span>Apply Findings to GPDP Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Standard Bot Message
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[85%] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs shadow-md space-y-1">
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                <span className="text-[9px] text-[var(--text-muted)] block text-left mt-1">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1.5 p-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl w-24">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action: Future Prediction */}
      <div className="px-3.5 py-2 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--text-muted)] font-medium truncate flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: activePalette.primary }} />
          <span>5-Year Development Forecast:</span>
        </span>
        <button
          type="button"
          onClick={handleGoToPrediction}
          className="px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${activePalette.secondary}, ${activePalette.primary})`,
          }}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Future Prediction</span>
        </button>
      </div>

      {/* Text Query Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex items-center gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={`Ask anything about ${selectedLocation?.gp_name || 'Gram Panchayat'} governance...`}
          className="flex-1 px-3.5 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

VillageChatbot.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onNavigateToPrediction: PropTypes.func,
};
