"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  BookOpen,
  Code,
  Calendar,
  Compass,
  ArrowRight,
  Loader2,
  CheckCircle,
  Circle,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  ChevronDown,
  History,
  Trash2,
  Bookmark,
  Printer
} from "lucide-react";

// Structure of the roadmap API response
interface Phase {
  phaseNumber: number;
  phaseTitle: string;
  phaseDescription: string;
  milestone: string;
  steps: string[];
}

interface KeyConcept {
  conceptName: string;
  explanation: string;
  importance: string;
}

interface Project {
  projectName: string;
  projectDescription: string;
  keyFeatures: string[];
  suggestedTechStack: string[];
}

interface DayTask {
  day: string;
  focus: string;
  tasks: string[];
}

interface WeeklySchedule {
  weekNumber: number;
  weekTopic: string;
  weeklyObjective: string;
  timeCommitment: string;
  dailyBreakdown: DayTask[];
}

interface RoadmapData {
  topic: string;
  difficultyLevel: string;
  estimatedTimeToComplete: string;
  roadmap: Phase[];
  keyConcepts: KeyConcept[];
  recommendedProjects: Project[];
  weeklyStudySchedule: WeeklySchedule[];
}

interface HistoryItem {
  id: string;
  topic: string;
  level: string;
  duration: string;
  data: RoadmapData;
  createdAt: string;
}

const POPULAR_TOPICS = [
  "Python Programming",
  "HTML CSS and Web Development",
  "Machine Learning Foundations",
  "AI Agents and NLP",
  "React with TypeScript",
  "Cybersecurity Fundamentals",
  "Data Structures and Algorithms"
];

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const TYPICAL_DURATIONS = ["4 Weeks", "8 Weeks", "12 Weeks", "Self-Paced"];

export default function Page() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState("8 Weeks");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local storage properties & initial states loaded lazily to respect React best practices and ESLint rules
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem("roadmap_history");
        return savedHistory ? JSON.parse(savedHistory) : [];
      } catch (e) {
        console.error("Error reading roadmap_history", e);
      }
    }
    return [];
  });

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCompleted = localStorage.getItem("roadmap_completed_steps");
        return savedCompleted ? JSON.parse(savedCompleted) : {};
      } catch (e) {
        console.error("Error reading roadmap_completed_steps", e);
      }
    }
    return {};
  });

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem("roadmap_history");
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (parsed.length > 0) {
            return parsed[0].data;
          }
        }
      } catch (e) {}
    }
    return null;
  });

  const [currentId, setCurrentId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem("roadmap_history");
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (parsed.length > 0) {
            return parsed[0].id;
          }
        }
      } catch (e) {}
    }
    return null;
  });

  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"pathway" | "concepts" | "projects" | "schedule">("pathway");

  // Save history state to local storage when changed
  const saveHistoryToStorage = (updatedHistory: HistoryItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem("roadmap_history", JSON.stringify(updatedHistory));
  };

  // Toggle step completion helper
  const toggleStep = (stepKey: string) => {
    const updated = {
      ...completedSteps,
      [stepKey]: !completedSteps[stepKey],
    };
    setCompletedSteps(updated);
    localStorage.setItem("roadmap_completed_steps", JSON.stringify(updated));
  };

  // Handle roadmap generation submission
  const generateRoadmap = async (selectedTopic: string = topic) => {
    const queryTopic = selectedTopic.trim();
    if (!queryTopic) {
      setError("Please specify a topic or select a quick suggestion.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: queryTopic,
          level,
          duration,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to generate study roadmap. Please try again.");
      }

      const generatedData: RoadmapData = await response.json();
      
      const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newHistoryItem: HistoryItem = {
        id: newId,
        topic: queryTopic,
        level,
        duration,
        data: generatedData,
        createdAt: new Date().toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      };

      const updatedHistory = [newHistoryItem, ...history.filter(h => h.topic.toLowerCase() !== queryTopic.toLowerCase())];
      setRoadmap(generatedData);
      setCurrentId(newId);
      saveHistoryToStorage(updatedHistory.slice(0, 10)); // limit history to last 10 entries
      setActiveTab("pathway");
      setExpandedWeek(0); // reset expanded week to first week
      
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please verify your connection and settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setRoadmap(item.data);
    setCurrentId(item.id);
    setActiveTab("pathway");
    setExpandedWeek(0);
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== idToDelete);
    saveHistoryToStorage(updated);
    
    if (currentId === idToDelete) {
      if (updated.length > 0) {
        setRoadmap(updated[0].data);
        setCurrentId(updated[0].id);
      } else {
        setRoadmap(null);
        setCurrentId(null);
      }
    }
  };

  // Print support
  const triggerPrint = () => {
    window.print();
  };

  // Helper to calculate total completion progress of the current roadmap
  const getOverallProgress = () => {
    if (!roadmap || !currentId) return 0;
    let totalSteps = 0;
    let doneSteps = 0;
    roadmap.roadmap.forEach((phase) => {
      phase.steps.forEach((_, stepIdx) => {
        totalSteps++;
        const key = `${currentId}-${phase.phaseNumber}-${stepIdx}`;
        if (completedSteps[key]) {
          doneSteps++;
        }
      });
    });
    return totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#050505] text-[#e0e0e0]" id="app-root">
      {/* Dynamic Navigation Header styled with Sophisticated Dark theme */}
      <header className="border-b border-[#222] bg-[#080808] sticky top-0 z-50 print:hidden" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c5a059] rounded-sm flex items-center justify-center font-serif text-[#050505] font-bold text-sm">
              M
            </div>
            <div>
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#666] block uppercase">Intelligence Engine</span>
              <h1 className="font-serif text-lg tracking-wide font-light text-neutral-100 leading-none mt-0.5">
                AI Learning <span className="text-[#c5a059]">Roadmap</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-wider text-[#888] bg-[#111] px-3 py-1.5 border border-[#222] rounded uppercase">
              System Status: Optimal
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="dashboard-workspace">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Generators and Parameters */}
          <section className="lg:col-span-4 space-y-6 print:hidden" id="configuration-panel">
            
            {/* Input Generator Dashboard */}
            <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-xs font-semibold tracking-[0.2em] text-[#c5a059] uppercase font-mono">Configure Subject</h2>
                <p className="text-xs text-[#888] leading-relaxed">Specify your destination or select from our suggestions below.</p>
              </div>

              {/* Subject Input */}
              <div className="space-y-2">
                <label htmlFor="topic-input" className="text-xs font-semibold text-neutral-300 block uppercase tracking-wider">Topic / Concept Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                    <Search className="w-4 h-4 text-[#c5a059]/70" />
                  </span>
                  <input
                    id="topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Machine Learning, Python, Web Dev..."
                    className="w-full bg-[#111] border border-[#222] text-sm text-[#e0e0e0] placeholder-[#444] rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#c5a059] transition font-light"
                  />
                </div>
              </div>

              {/* Target Difficulty Level Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 block uppercase tracking-wider">Expertise Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`py-1.5 px-3 rounded-md text-xs font-medium border transition ${
                        level === lvl
                          ? "bg-[#141414] border-[#c5a059] text-[#c5a059] font-semibold"
                          : "bg-neutral-950/20 border-[#222] text-[#888] hover:border-neutral-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Timeframe Duration Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 block uppercase tracking-wider">Study Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPICAL_DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`py-1.5 px-3 rounded-md text-xs font-medium border transition ${
                        duration === dur
                          ? "bg-[#141414] border-[#c0994f] text-[#c5a059] font-semibold"
                          : "bg-neutral-950/20 border-[#222] text-[#888] hover:border-neutral-700"
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fire Generator CTA Button */}
              <button
                type="button"
                onClick={() => generateRoadmap()}
                disabled={loading || !topic.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 bg-[#c5a059] hover:bg-[#b08d4a] text-[#050505] disabled:bg-[#1a1a1a] disabled:text-[#444] disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#050505]" />
                    Synthesizing Pathway...
                  </>
                ) : (
                  <>
                    Generate Study Pathway
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Error feedback if any */}
              {error && (
                <div className="p-3 bg-red-950/20 border border-red-900 rounded-lg text-xs text-red-400 leading-relaxed text-center font-mono">
                  {error}
                </div>
              )}
            </div>

            {/* Quick suggestions shortcut */}
            <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-6 space-y-4">
              <h2 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase font-mono">Popular Pathways</h2>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TOPICS.map((popTopic) => (
                  <button
                    key={popTopic}
                    type="button"
                    onClick={() => {
                      setTopic(popTopic);
                      generateRoadmap(popTopic);
                    }}
                    disabled={loading}
                    className="py-1 px-2.5 text-xs bg-[#111] border border-[#222] hover:border-[#c5a059]/40 text-[#c5a059] hover:text-white rounded-md transition cursor-pointer text-left"
                  >
                    + {popTopic}
                  </button>
                ))}
              </div>
            </div>

            {/* History Collection Sidebar */}
            {history.length > 0 && (
              <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase font-mono flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#c5a059]" />
                    Saved Path History
                  </h2>
                  <span className="text-neutral-600 font-mono text-[10px]">{history.length}/10</span>
                </div>

                <div className="divide-y divide-[#1a1a1a] max-h-64 overflow-y-auto pr-1 space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistoryItem(item)}
                      className={`group w-full p-2.5 rounded-lg text-left transition cursor-pointer border flex justify-between items-center ${
                        currentId === item.id
                          ? "bg-[#111] border-[#222]"
                          : "bg-[#0d0d0d]/60 border-transparent hover:bg-[#111] hover:border-[#1a1a1a]"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-medium text-neutral-200 truncate">{item.topic}</p>
                        <div className="flex items-center gap-1 text-[10px] text-[#666] font-mono mt-0.5">
                          <span>{item.level}</span>
                          <span>•</span>
                          <span>{item.duration}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#333] text-neutral-500 hover:text-red-400 transition"
                        title="Delete roadmap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* RIGHT PANEL: Roadmap Display Container */}
          <section className="lg:col-span-8 space-y-6" id="display-workspace">
            
            <AnimatePresence mode="wait">
              {roadmap ? (
                <motion.div
                  key={currentId || "roadmap-loaded"}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* METRIC HEADMASTER SUMMARY BLOCK */}
                  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#c5a059] border border-[#222] bg-[#111] px-2.5 py-0.5 rounded">
                          Target Curriculum Pathway
                        </span>
                      </div>
                      <h2 className="font-serif text-xl sm:text-2xl font-light text-[#e0e0e0] tracking-wide leading-tight">
                        {roadmap.topic}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-[#888] pt-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#c5a059]" />
                          Level: <strong className="text-[#c5a059] font-semibold">{roadmap.difficultyLevel}</strong>
                        </span>
                        <span className="text-neutral-800 border-l border-neutral-800 h-3.5 hidden sm:block"></span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                          Empirical Duration: <strong className="text-[#c5a059] font-semibold">{roadmap.estimatedTimeToComplete}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Progress Circle & Print trigger */}
                    <div className="flex items-center gap-5 border-t border-[#1a1a1a] pt-4 md:pt-0 md:border-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-[#666] block tracking-wide uppercase">Path Completed</span>
                        <span className="text-xl font-semibold text-neutral-100 font-mono">{getOverallProgress()}%</span>
                        <div className="w-24 bg-[#111] h-1.5 rounded-full overflow-hidden mt-1 border border-[#222]">
                          <div 
                            className="bg-[#c5a059] h-full transition-all duration-300"
                            style={{ width: `${getOverallProgress()}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={triggerPrint}
                        className="p-2.5 rounded-lg border border-[#222] bg-[#111] hover:bg-[#161616] text-[#c5a059] transition cursor-pointer print:hidden"
                        title="Print / Save PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* NAV-TABS FOR DISSECTED ROADMAP SECTIONS */}
                  <div className="flex items-center space-x-1 p-1 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-x-auto print:hidden font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveTab("pathway")}
                      className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition duration-150 flex items-center justify-center gap-1.5 min-w-[110px] uppercase tracking-wider ${
                        activeTab === "pathway"
                          ? "bg-[#141414] text-[#c5a059] font-bold border border-[#222]"
                          : "text-[#888] hover:text-neutral-200 hover:bg-[#111]"
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      The Pathway
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("concepts")}
                      className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition duration-150 flex items-center justify-center gap-1.5 min-w-[110px] uppercase tracking-wider ${
                        activeTab === "concepts"
                          ? "bg-[#141414] text-[#c5a059] font-bold border border-[#222]"
                          : "text-[#888] hover:text-neutral-200 hover:bg-[#111]"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Crucial Concepts
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("projects")}
                      className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition duration-150 flex items-center justify-center gap-1.5 min-w-[110px] uppercase tracking-wider ${
                        activeTab === "projects"
                          ? "bg-[#141414] text-[#c5a059] font-bold border border-[#222]"
                          : "text-[#888] hover:text-neutral-200 hover:bg-[#111]"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      Key Projects
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("schedule")}
                      className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition duration-150 flex items-center justify-center gap-1.5 min-w-[110px] uppercase tracking-wider ${
                        activeTab === "schedule"
                          ? "bg-[#141414] text-[#c5a059] font-bold border border-[#222]"
                          : "text-[#888] hover:text-neutral-200 hover:bg-[#111]"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Study Schedule
                    </button>
                  </div>

                  {/* ACTIVE TAB VIEWRIGHT BLOCK */}
                  <div className="space-y-6" id="roadmap-tab-content-container">

                    {/* TAB A: LEARNING PATHWAY ROADMAP */}
                    {activeTab === "pathway" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between print:mb-4">
                          <h3 className="font-serif text-lg tracking-wide text-[#e0e0e0]">
                            The Mastery Path
                          </h3>
                          <span className="text-xs text-[#666] font-mono uppercase tracking-wider print:hidden">
                            Track Progress
                          </span>
                        </div>

                        <div className="relative border-l border-[#222] pl-6 ml-3 space-y-6">
                          {roadmap.roadmap.map((phase, phaseIndex) => {
                            const phaseStepKeys = phase.steps.map((_, sIdx) => `${currentId}-${phase.phaseNumber}-${sIdx}`);
                            const allCompleted = phaseStepKeys.every(k => !!completedSteps[k]);
                            
                            return (
                              <div key={phase.phaseNumber} className="relative">
                                {/* Timeline luxury indicator node */}
                                <div className={`absolute -left-[35px] top-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full border-2 transition z-10 ${
                                  allCompleted 
                                    ? "border-[#c5a059] bg-[#0d0d0d] shadow-[0_0_8px_rgba(197,160,89,0.4)]" 
                                    : "border-[#555] bg-[#050505]"
                                }`}>
                                  {allCompleted && (
                                    <div className="w-1.5 h-1.5 bg-[#c5a059] rounded-full" />
                                  )}
                                </div>

                                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 sm:p-6 space-y-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-[#c5a059] font-mono font-bold uppercase tracking-widest block font-sans focus:outline-none">
                                    Phase 0{phase.phaseNumber}
                                  </span>
                                  <h4 className="text-lg font-medium text-[#e0e0e0] tracking-tight">
                                    {phase.phaseTitle}
                                  </h4>
                                  <p className="text-xs text-[#888] leading-relaxed font-light">
                                    {phase.phaseDescription}
                                  </p>
                                </div>

                                {/* Step checkable pathways */}
                                <div className="border-t border-[#1a1a1a] pt-4 space-y-2.5">
                                  <span className="text-[9px] font-mono uppercase text-[#666] tracking-widest block font-sans">Operational Tasks</span>
                                  {phase.steps.map((step, stepId) => {
                                    const stepKey = `${currentId}-${phase.phaseNumber}-${stepId}`;
                                    const isDone = !!completedSteps[stepKey];
                                    return (
                                      <div
                                        key={stepId}
                                        onClick={() => toggleStep(stepKey)}
                                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition cursor-pointer select-none ${
                                          isDone
                                            ? "bg-[#111]/80 border-[#222]/40 text-[#666]"
                                            : "bg-[#141414] border-[#222] text-[#e0e0e0] hover:border-[#c5a059]/40"
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          className={`mt-0.5 outline-none focus:outline-none shrink-0 ${
                                            isDone ? "text-[#c5a059]" : "text-neutral-500 hover:text-[#c5a059]"
                                          }`}
                                        >
                                          {isDone ? (
                                            <CheckCircle className="w-4 h-4 text-[#c5a059]" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-[#444]" />
                                          )}
                                        </button>
                                        <span className={`text-xs font-light leading-snug ${isDone ? "line-through text-[#666]" : ""}`}>
                                          {step}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Verified Target Milestone key value */}
                                {phase.milestone && (
                                  <div className="p-3 bg-[#111] rounded-lg border border-[#222] flex items-start gap-2.5 text-xs">
                                    <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border border-[#222] bg-[#0d0d0d] text-[#c5a059] mt-0.5 shrink-0">
                                      Milestone
                                    </span>
                                    <div className="text-[#888] flex-grow font-sans">
                                      <strong className="text-neutral-300 block text-[10px] uppercase font-mono tracking-wider mb-0.5">Key Validation Result:</strong>
                                      {phase.milestone}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}

                    {/* TAB B: KEY CONCEPTS */}
                    {activeTab === "concepts" && (
                      <div className="space-y-6">
                        <h3 className="font-serif text-lg tracking-wide text-[#e0e0e0]">
                          Crucial Concepts to Understand
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {roadmap.keyConcepts.map((concept, index) => (
                            <div
                              key={index}
                              className="bg-[#0d0d0d] border border-[#1a1a1a] p-5 rounded-xl space-y-4 hover:border-[#c5a059]/30 transition flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <span className="font-mono text-[9px] text-[#666] tracking-widest uppercase block">
                                  Theoretical Core 0{index + 1}
                                </span>
                                <h4 className="text-sm font-medium text-neutral-100 tracking-tight">
                                  {concept.conceptName}
                                </h4>
                                <p className="text-xs text-[#888] leading-relaxed font-light">
                                  {concept.explanation}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-[#1a1a1a] mt-4 text-[11px] text-[#888] space-y-1">
                                <strong className="text-[#c5a059] block font-mono text-[9px] uppercase tracking-wider">
                                  Structural Relevance
                                </strong>
                                <p className="italic font-light">
                                  {concept.importance}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB C: RECOMMENDED PROJECTS */}
                    {activeTab === "projects" && (
                      <div className="space-y-6 font-sans">
                        <h3 className="font-serif text-lg tracking-wide text-[#e0e0e0]">
                          Milestone Integration Projects
                        </h3>

                        <div className="space-y-4">
                          {roadmap.recommendedProjects.map((proj, index) => (
                            <div
                              key={index}
                              className="bg-[#0d0d0d] border border-[#1a1a1a] p-5 sm:p-6 rounded-xl space-y-5"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a1a1a] pb-3">
                                <div className="space-y-1">
                                  <span className="font-mono text-[9px] text-[#c5a059] uppercase tracking-widest block">
                                    Sandbox Assignment 0{index + 1}
                                  </span>
                                  <h4 className="text-base font-medium text-neutral-100 tracking-tight">
                                    {proj.projectName}
                                  </h4>
                                </div>
                              </div>

                              <p className="text-xs text-[#888] leading-relaxed font-light">
                                {proj.projectDescription}
                              </p>

                              <div className="space-y-2">
                                <div className="text-[9px] font-mono text-[#666] uppercase tracking-widest">
                                  Technical Checklist Specifications
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {proj.keyFeatures.map((feat, fIdx) => (
                                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-neutral-300 bg-[#111] p-2.5 border border-[#1a1a1a] rounded">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059] mt-2 shrink-0" />
                                      <span className="font-light">{feat}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2 pt-2">
                                <div className="text-[9px] font-mono text-[#666] uppercase tracking-widest">
                                  Suggested Stack
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {proj.suggestedTechStack.map((tech, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="font-mono text-[10px] bg-[#111] text-[#c5a059] border border-[#222] px-2.5 py-1 rounded"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB D: STUDY SCHEDULE */}
                    {activeTab === "schedule" && (
                      <div className="space-y-6">
                        <h3 className="font-serif text-lg tracking-wide text-[#e0e0e0]">
                          The Study Schedule
                        </h3>

                        <div className="space-y-3">
                          {roadmap.weeklyStudySchedule.map((week, idx) => {
                            const isExpanded = expandedWeek === idx;
                            return (
                              <div
                                key={week.weekNumber}
                                className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden"
                              >
                                {/* Accordion Header */}
                                <div
                                  onClick={() => setExpandedWeek(isExpanded ? null : idx)}
                                  className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-[#111]/40 transition"
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="font-mono bg-[#111] border border-[#222] text-[#c5a059] text-xs py-1 px-2.5 rounded-md font-bold shrink-0">
                                      Week {week.weekNumber}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-xs sm:text-sm font-medium text-neutral-200 truncate">
                                        {week.weekTopic}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-[#666] font-mono flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-[#c5a059]" />
                                          {week.timeCommitment}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-[#666] hover:text-[#c5a059] transition shrink-0 pr-1">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-[#c5a059]" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>

                                {/* Accordion Expanded Body */}
                                {isExpanded && (
                                  <div className="border-t border-[#1a1a1a] p-4 sm:p-5 bg-neutral-900/10 space-y-4">
                                    
                                    {/* High level objective */}
                                    <div className="p-3 bg-[#111] rounded-lg border border-[#222]">
                                      <span className="text-[9px] font-mono uppercase text-[#c5a059] tracking-widest">Weekly Objective</span>
                                      <p className="text-xs text-[#888] font-light mt-1">{week.weeklyObjective}</p>
                                    </div>

                                    {/* Daily micro plans */}
                                    <div className="space-y-3">
                                      <span className="text-[9px] font-mono text-[#666] uppercase tracking-widest block">Daily Study Intervals</span>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {week.dailyBreakdown.map((dayPlan, dIdx) => (
                                          <div key={dIdx} className="bg-[#111] border border-[#1a1a1a] p-3.5 rounded-lg space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="font-mono text-[9px] text-[#c5a059] font-bold bg-[#0d0d0d] px-2 py-0.5 border border-[#222] rounded">
                                                {dayPlan.day}
                                              </span>
                                            </div>
                                            <div>
                                              <strong className="text-xs text-[#e0e0e0] font-medium block mb-1">{dayPlan.focus}</strong>
                                              <ul className="space-y-1">
                                                {dayPlan.tasks.map((task, tIdx) => (
                                                  <li key={tIdx} className="text-[11px] text-[#888] leading-relaxed flex items-start gap-1.5 font-light">
                                                    <span className="text-[#c5a059] shrink-0">•</span>
                                                    <span>{task}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                </motion.div>
              ) : (
                /* EMPTY PLACEHOLDER SCREEN */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-8 sm:p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[450px]"
                >
                  <div className="p-4 bg-[#111] rounded-full border border-[#222] text-[#c5a059]">
                    <Compass className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  
                  <div className="max-w-md space-y-2 font-sans">
                    <h2 className="font-serif text-lg tracking-wide text-neutral-100">
                      No Pathway Map Loaded
                    </h2>
                    <p className="text-xs text-[#888] leading-relaxed font-light">
                      Enter a topic on the left sidebar configured panel to generate a beautifully structured, elegant roadmap. It compiles essential checkpoints, code assignments, theoretical core modules, and detailed weekly calendars.
                    </p>
                  </div>

                  {/* Starter Suggestions box */}
                  <div className="border border-[#222] border-dashed rounded-lg p-5 max-w-lg w-full bg-[#111]/40">
                    <p className="text-[9px] font-mono text-[#666] uppercase tracking-widest mb-3 text-center">
                      Recommended Starters
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-left font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setTopic("Python Language Fundamentals");
                          setLevel("Beginner");
                          setDuration("4 Weeks");
                          generateRoadmap("Python Language Fundamentals");
                        }}
                        className="p-2.5 rounded border border-[#222] hover:border-[#c5a059]/40 bg-[#0d0d0d] text-xs text-[#c5a059] transition text-left cursor-pointer font-light"
                      >
                        Python Basics (Beginner)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTopic("AI Agents development");
                          setLevel("Advanced");
                          setDuration("8 Weeks");
                          generateRoadmap("AI Agents development");
                        }}
                        className="p-2.5 rounded border border-[#222] hover:border-[#c5a059]/40 bg-[#0d0d0d] text-xs text-[#c5a059] transition text-left cursor-pointer font-light"
                      >
                        AI Agents (Advanced)
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1a1a1a] bg-[#080808] py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-mono text-neutral-500">
          <div>
            AI Learning Roadmap Generator • Designed with strict neutral typography.
          </div>
          <div>
            Zero Gradients. Zero Emojis. Full Client Control.
          </div>
        </div>
      </footer>
    </div>
  );
}
