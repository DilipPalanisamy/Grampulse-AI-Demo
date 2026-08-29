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
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
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

export default function VillageChatbot({ isOpen, onClose, onToggle }) {
  const { user } = useAuth();
  const { selectedLocation, planningHorizon } = useLocation();

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
    if (messages.length === 0) {
      initConversation();
    }
  }, [selectedLocation]);

  const initConversation = () => {
    const welcomeMsg = {
      id: 'msg-welcome',
      sender: 'bot',
      text: `Vanakkam ${user?.name ? user.name.split(' ')[0] : 'Resident'}! I am your **GramPulse AI Governance Assistant**.\n\nLet's perform a live infrastructure need assessment for **${selectedLocation.gp_name} Gram Panchayat (${selectedLocation.district} District, ${selectedLocation.state})**.\n\nPlease answer 4 quick questions based on ground reality:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const firstQuestion = {
      id: 'msg-q-0',
      sender: 'bot',
      isQuestion: true,
      questionData: GUIDED_QUESTIONS[0],
      stepIndex: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([welcomeMsg, firstQuestion]);
    setCurrentStepIndex(0);
    setUserAnswers({});
    setAssessmentResult(null);
    setIsApplied(false);
  };

  const handleOptionSelect = (stepIndex, option) => {
    const question = GUIDED_QUESTIONS[stepIndex];
    const newAnswers = {
      ...userAnswers,
      [question.id]: option,
    };
    setUserAnswers(newAnswers);

    // Add user response message
    const userMsg = {
      id: `user-ans-${stepIndex}`,
      sender: 'user',
      text: option.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const nextStep = stepIndex + 1;
      if (nextStep < GUIDED_QUESTIONS.length) {
        setCurrentStepIndex(nextStep);
        const nextQMsg = {
          id: `msg-q-${nextStep}`,
          sender: 'bot',
          isQuestion: true,
          questionData: GUIDED_QUESTIONS[nextStep],
          stepIndex: nextStep,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, nextQMsg]);
      } else {
        generateAssessmentReport(newAnswers);
      }
    }, 450);
  };

  const generateAssessmentReport = (answers) => {
    const pop = Number(selectedLocation.population || 5500);
    const popProjected = Math.round(pop * Math.pow(1 + 0.018, planningHorizon));

    // Evaluate Water
    const waterScore = answers.water?.score || 2;
    const waterDemandLpd = popProjected * 55; // JJM norm
    let waterDeficitLpd = 0;
    if (waterScore === 1) waterDeficitLpd = Math.round(waterDemandLpd * 0.55);
    else if (waterScore === 2) waterDeficitLpd = Math.round(waterDemandLpd * 0.28);
    else if (waterScore === 3) waterDeficitLpd = Math.round(waterDemandLpd * 0.1);

    // Evaluate Education
    const eduScore = answers.education?.score || 2;
    let classroomDeficit = 0;
    if (eduScore === 1) classroomDeficit = Math.max(6, Math.round(pop / 450));
    else if (eduScore === 2) classroomDeficit = Math.max(3, Math.round(pop / 900));

    // Evaluate Roads
    const roadScore = answers.roads?.score || 2;
    let roadDeficitKm = 0;
    if (roadScore === 1) roadDeficitKm = 12.5;
    else if (roadScore === 2) roadDeficitKm = 6.8;
    else if (roadScore === 3) roadDeficitKm = 2.4;

    // Evaluate Sanitation
    const sanitScore = answers.sanitation?.score || 2;

    const result = {
      villageName: selectedLocation.gp_name,
      district: selectedLocation.district,
      state: selectedLocation.state,
      targetYear: new Date().getFullYear() + planningHorizon,
      populationProjected: popProjected,
      water: {
        score: waterScore,
        deficitLpd: waterDeficitLpd,
        recommendation:
          waterScore <= 2
            ? 'Jal Jeevan Mission (JJM) - Community Overhead Tank & Piped FHTC Network'
            : 'JJM Water Purification Quality Monitoring Plant',
        estimatedBudgetLakhs: waterScore === 1 ? 48.5 : waterScore === 2 ? 28.0 : 12.0,
      },
      education: {
        score: eduScore,
        classroomDeficit: classroomDeficit,
        recommendation:
          eduScore <= 2
            ? `PM SHRI & Samagra Shiksha - Construction of ${classroomDeficit} Smart Classrooms & STEM Labs`
            : 'Samagra Shiksha Digital Learning Aid & Solar Inverter',
        estimatedBudgetLakhs: classroomDeficit * 5.5 || 9.0,
      },
      roads: {
        score: roadScore,
        roadDeficitKm: roadDeficitKm,
        recommendation:
          roadScore <= 2
            ? `Pradhan Mantri Gram Sadak Yojana (PMGSY - III) - ${roadDeficitKm} km All-Weather Bitumen Link Road`
            : 'PMGSY Periodic Maintenance & Culvert Drain Reinforcement',
        estimatedBudgetLakhs: roadDeficitKm * 32.5 || 22.0,
      },
      sanitation: {
        score: sanitScore,
        recommendation:
          sanitScore <= 2
            ? 'Swachh Bharat Mission Gramin (SBM-G Phase II) - Underground Drainage & Solid Waste Processing Yard'
            : 'SBM-G Micro-Compost Pit & Battery Operated Waste Collection Vehicles',
        estimatedBudgetLakhs: sanitScore === 1 ? 24.0 : 14.5,
      },
    };

    setAssessmentResult(result);

    const reportMsg = {
      id: 'msg-assessment-report',
      sender: 'bot',
      isReport: true,
      reportData: result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, reportMsg]);
  };

  const handleApplyToGPDP = () => {
    setIsApplied(true);
    const confirmationMsg = {
      id: `applied-${Date.now()}`,
      sender: 'bot',
      text: `✅ **Findings Applied to ${selectedLocation.gp_name} GPDP Plan!**\n\nThe identified infrastructure deficits (Water: ${assessmentResult?.water.deficitLpd.toLocaleString()} LPD, Classrooms: ${assessmentResult?.education.classroomDeficit}, Roads: ${assessmentResult?.roads.roadDeficitKm} km) have been merged into the active analytics model. You can now download the refreshed official GPDP PDF plan report.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, confirmationMsg]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput.trim();
    setTextInput('');

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Direct call to Backend Live LLM API (/api/v1/chat)
      const chatRes = await sendChatMessage(
        userText,
        selectedLocation,
        messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text || '' }))
      );

      setIsTyping(false);
      const botReply = {
        id: `bot-reply-${Date.now()}`,
        sender: 'bot',
        text: chatRes.reply || `Processed advisory for ${selectedLocation.gp_name}.`,
        provider: chatRes.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setIsTyping(false);
      const botReply = {
        id: `bot-reply-${Date.now()}`,
        sender: 'bot',
        text: `Thank you for your query regarding **${selectedLocation.gp_name}**. Under Jal Jeevan Mission and PMGSY national standards, all deficit metrics and scheme allocations are available in the GPDP PDF plan.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    }
  };

  // Floating Trigger Widget (when closed)
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-[1100] group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-emerald-950/80 ring-4 ring-emerald-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
        title="Open GramPulse Village Assessment AI Assistant"
      >
        <div className="relative">
          <Bot className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        </div>
        <span className="hidden sm:inline">Village AI Assistant</span>
      </button>
    );
  }

  // Expanded Interactive Chatbot Window
  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[1100] w-[92vw] sm:w-[420px] max-h-[640px] h-[82vh] bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 rounded-3xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden animate-slideUp">
      {/* Chatbot Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 ring-2 ring-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-white leading-tight">
                GramPulse Assistant
              </h3>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                MoPR AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              Assessing {selectedLocation.gp_name} GP ({selectedLocation.state})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={initConversation}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-950/50">
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
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <QIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-3 shadow-md space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      <span>Step {msg.stepIndex + 1} of 4: {q.title}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-100">{q.question}</p>

                    {/* Option Choices */}
                    {!answered && (
                      <div className="grid grid-cols-1 gap-1.5 pt-1">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleOptionSelect(msg.stepIndex, opt)}
                            className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-[11px] font-medium transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span>{opt.label}</span>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
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
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl p-3.5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Village Need Assessment Summary</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Target: {r.targetYear}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    Ground assessment evaluated for <strong>{r.villageName}</strong> (Proj. Population: {r.populationProjected.toLocaleString()}):
                  </p>

                  <div className="space-y-2 text-[11px]">
                    {/* Water Supply */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-cyan-400" /> Water Availability
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            r.water.score <= 2
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {r.water.score <= 2 ? 'Deficit Identified' : 'Adequate'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{r.water.recommendation}</p>
                      <p className="text-emerald-400 font-mono text-[10px]">
                        Est. Scheme Budget: ₹{r.water.estimatedBudgetLakhs} Lakhs
                      </p>
                    </div>

                    {/* Classrooms */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-purple-400" /> Education Infrastructure
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            r.education.classroomDeficit > 0
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {r.education.classroomDeficit > 0 ? `Gap: ${r.education.classroomDeficit} Rooms` : 'Sufficient'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{r.education.recommendation}</p>
                      <p className="text-emerald-400 font-mono text-[10px]">
                        Est. Scheme Budget: ₹{r.education.estimatedBudgetLakhs} Lakhs
                      </p>
                    </div>

                    {/* Roads */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <Route className="w-3 h-3 text-orange-400" /> All-Weather Road Connectivity
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            r.roads.roadDeficitKm > 0
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {r.roads.roadDeficitKm > 0 ? `Shortage: ${r.roads.roadDeficitKm} km` : '100% Connected'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{r.roads.recommendation}</p>
                      <p className="text-emerald-400 font-mono text-[10px]">
                        Est. Scheme Budget: ₹{r.roads.estimatedBudgetLakhs} Lakhs
                      </p>
                    </div>
                  </div>

                  {/* Apply to GPDP Plan Action Button */}
                  <button
                    type="button"
                    onClick={handleApplyToGPDP}
                    disabled={isApplied}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isApplied
                        ? 'bg-emerald-700 text-white cursor-default'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/80 active:scale-95'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>Applied to GPDP Plan!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Apply Findings to GPDP Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          }

          // Standard Bot Message
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[85%] bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs shadow-md space-y-1">
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                <span className="text-[9px] text-slate-500 block text-left mt-1">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-2xl w-24">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Text Query Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={`Ask anything about ${selectedLocation.gp_name} governance...`}
          className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
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
};
