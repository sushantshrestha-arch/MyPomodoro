import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  LayoutDashboard, 
  BrainCircuit, 
  Trophy, 
  Settings,
  ArrowRight,
  Plus,
  Clock,
  ChevronRight,
  GripVertical,
  Trash2,
  Sparkles,
  Download,
  Flame,
  Target,
  Zap,
  AlertTriangle,
  PieChart as PieChartIcon,
  Search,
  FileDown,
  Settings as SettingsIcon,
  Music,
  BellOff,
  Palette,
  Type,
  User,
  RefreshCw,
  Library,
  Shield,
  CreditCard,
  Sun,
  Moon,
  Volume2,
  Lock
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  AreaChart,
  Area
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "./lib/utils.ts";
import { Priority, Task, Screen, SessionStats, TimerMode } from "./types.ts";
import { organizeDay } from "./services/aiService.ts";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("workspace");
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: "1", 
      title: "Designing User Flow for App", 
      priority: Priority.HIGH, 
      estimatedBlocks: 4, 
      completedBlocks: 1,
      category: "Design",
      subTasks: [
        { id: "s1", title: "Sketch Initial Ideas", completed: true, estimatedMinutes: 25 },
        { id: "s2", title: "Refine Low-Fi Wireframes", completed: false, estimatedMinutes: 50 },
        { id: "s3", title: "User Testing Feedback", completed: false, estimatedMinutes: 25 }
      ]
    },
    {
      id: "2",
      title: "Reading Documentation",
      priority: Priority.MEDIUM,
      estimatedBlocks: 2,
      completedBlocks: 1,
      category: "Learning",
      subTasks: [
        { id: "s4", title: "Review Recharts API", completed: true, estimatedMinutes: 25 },
        { id: "s5", title: "Implement Export Logic", completed: false, estimatedMinutes: 25 }
      ]
    }
  ]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>("1");
  const [timerMode, setTimerMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ 
    focusTime: 120, 
    tasksFinished: 5,
    streak: 4,
    deepWorkMinutes: 90,
    breakMinutes: 30,
    violations: 2,
    categoryDeepWork: [
      { category: "Design", minutes: 60 },
      { category: "Learning", minutes: 30 },
      { category: "Coding", minutes: 30 }
    ],
    violationHistory: [
      { taskTitle: "Designing User Flow", violations: 1 },
      { taskTitle: "Reading Tech", violations: 1 }
    ],
    unlockedRewards: ["Clay Theme", "Cyber Theme", "Deep Forest Track"]
  });
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"manual" | "ai" | null>(null);
  
  // Settings State
  const [focusDuration, setFocusDuration] = useState(25);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [autoStart, setAutoStart] = useState(false);
  const [isSilencerActive, setIsSilencerActive] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState("Lo-Fi Study");
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [selectedTheme, setSelectedTheme] = useState("Clay");
  const [settingsTab, setSettingsTab] = useState<"focus" | "zen" | "appearance" | "account" | "procrastination">("focus");
  
  // Manual Task State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskBlocks, setNewTaskBlocks] = useState(1);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (timerMode === "focus") {
        handleSessionComplete();
      } else {
        handleBreakComplete();
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  const handleSessionComplete = () => {
    setActiveScreen("rewards");
    setStats(prev => ({
      focusTime: prev.focusTime + focusDuration,
      tasksFinished: prev.tasksFinished + 1
    }));
    if (currentTaskId) {
      setTasks(prev => prev.map(t => 
        t.id === currentTaskId ? { ...t, completedBlocks: t.completedBlocks + 1 } : t
      ));
    }
    setTimerMode("break");
    setTimeLeft(breakDuration * 60);
  };

  const handleBreakComplete = () => {
    setTimerMode("focus");
    setTimeLeft(focusDuration * 60);
    // Optional: add a sound or notification here
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const activeTask = tasks.find(t => t.id === currentTaskId) || ((tasks || []).length > 0 ? tasks[0] : null);

  const handleOrganize = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    const newTasks = await organizeDay(aiInput);
    setTasks(newTasks);
    if (newTasks.length > 0) setCurrentTaskId(newTasks[0].id);
    setIsAiLoading(false);
    setActiveModal(null);
    setAiInput("");
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      title: newTaskTitle,
      priority: newTaskPriority,
      estimatedBlocks: newTaskBlocks,
      completedBlocks: 0,
      subTasks: [
        { id: Math.random().toString(36).substring(7), title: "Initial Session", completed: false, estimatedMinutes: 25 }
      ]
    };
    
    setTasks(prev => [...prev, newTask]);
    if ((tasks || []).length === 0 || !currentTaskId) setCurrentTaskId(newTask.id);
    setNewTaskTitle("");
    setNewTaskBlocks(1);
    setNewTaskPriority(Priority.MEDIUM);
    setActiveModal(null);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (currentTaskId === id) {
        setCurrentTaskId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const cyclePriority = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];
        const currentIndex = priorities.indexOf(t.priority);
        const nextIndex = (currentIndex + 1) % priorities.length;
        return { ...t, priority: priorities[nextIndex] };
      }
      return t;
    }));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTasks(items);
  };

  const handleUpdateDurations = (focus: number, breakTime: number) => {
    setFocusDuration(focus);
    setBreakDuration(breakTime);
    if (!isRunning) {
      setTimeLeft(timerMode === "focus" ? focus * 60 : breakTime * 60);
    }
  };

  const exportPDF = async () => {
    const dashboard = document.getElementById("stats-dashboard");
    if (!dashboard) return;
    
    const canvas = await html2canvas(dashboard, {
      backgroundColor: "#050505",
      scale: 2
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("pomodoro-productivity-report.pdf");
  };

  return (
    <div className="h-screen md:h-screen bg-neutral-950 text-neutral-50 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 bg-neutral-950 border-r border-white/5 p-6 flex-col gap-8 h-full shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">My Pomodoro</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavButton 
            active={activeScreen === "workspace"} 
            onClick={() => setActiveScreen("workspace")}
            icon={<Target className="w-5 h-5" />}
            label="Focus"
          />
          <NavButton 
            active={activeScreen === "rewards"} 
            onClick={() => setActiveScreen("rewards")}
            icon={<Trophy className="w-5 h-5" />}
            label="Stats"
          />
          <NavButton 
            active={activeScreen === "settings"} 
            onClick={() => setActiveScreen("settings")}
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
          />
        </nav>

        <div className="mt-auto p-4 bg-neutral-900 border border-white/5 rounded-2xl">
          <p className="text-xs text-neutral-500 mb-2 font-medium">DAILY GOAL</p>
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-bold">{Math.min(stats.tasksFinished, 8)}/8 Blocks</span>
            <span className="text-xs text-neutral-500">{Math.round((stats.tasksFinished / 8) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-cyan transition-all duration-500" 
              style={{ width: `${Math.min((stats.tasksFinished / 8) * 100, 100)}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-y-auto overflow-x-hidden bg-animate-gradient">
        <header className="md:hidden flex items-center justify-between p-4 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
          <span className="font-bold tracking-tight text-neutral-400 text-sm uppercase">My Pomodoro</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
        </header>

        <AnimatePresence mode="wait">
          {activeScreen === "workspace" && (
            <motion.div 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 gap-12 w-full pt-8 md:pt-12 relative"
            >
              {/* Ultra Minimal Timer Section */}
              <div id="pomodoro-timer" className="text-center w-full max-w-4xl mx-auto flex flex-col items-center gap-4 md:gap-8 relative border-b border-white/5 pb-12 md:pb-16 px-4">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-0 shadow-sm w-fit",
                  timerMode === "focus" 
                    ? "text-primary-cyan border-primary-cyan/20 bg-primary-cyan/5" 
                    : "text-green-400 border-green-400/20 bg-green-400/5"
                )}>
                  {timerMode === "focus" ? "Focus Mode" : "Break Time"}
                </span>
                
                <motion.div 
                  animate={isRunning ? { 
                    boxShadow: [
                      "inset 0 0 40px rgba(34,211,238,0.05)",
                      "inset 0 0 80px rgba(34,211,238,0.2)",
                      "inset 0 0 40px rgba(34,211,238,0.05)"
                    ]
                  } : { boxShadow: "inset 0 0 0px rgba(34,211,238,0)" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-0 timer-text text-[clamp(64px,25vw,120px)] md:text-[200px] font-medium tracking-tighter text-neutral-50 leading-none select-none transition-all duration-700 w-full md:w-fit flex items-center justify-center mx-auto px-4 sm:px-12 md:px-24 py-10 md:py-12 rounded-[2rem] md:rounded-[5rem] overflow-hidden"
                >
                  {isRunning && (
                    <motion.div 
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ 
                        opacity: [0.2, 0.6, 0.2],
                        rotate: 360
                      }}
                      transition={{ 
                        opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 15, repeat: Infinity, ease: "linear" }
                      }}
                      className="absolute inset-[-50%] -z-10 bg-[conic-gradient(from_0deg,transparent,rgba(34,211,238,0.25),transparent)] blur-[80px]"
                    />
                  )}
                  {formatTime(timeLeft)}
                </motion.div>
                
                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-xl",
                      timerMode === "focus" 
                        ? "bg-neutral-50 text-neutral-950 shadow-white/10" 
                        : "bg-green-500 text-white shadow-green-500/20"
                    )}
                  >
                    {isRunning ? <Pause className="fill-current w-7 h-7" /> : <Play className="fill-current w-7 h-7 ml-1" />}
                  </button>
                  <button 
                    onClick={() => {
                      setIsRunning(false);
                      setTimeLeft(timerMode === "focus" ? focusDuration * 60 : breakDuration * 60);
                    }}
                    className="w-16 h-16 bg-neutral-900 border border-white/10 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors"
                  >
                    <RotateCcw className="w-7 h-7" />
                  </button>
                </div>
              </div>

              {/* Integrated Session List - Central Bottom */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="main-tasks">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-full max-w-sm mt-8 space-y-6"
                    >
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Sessions</span>
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{(tasks || []).length} Cycles</span>
                      </div>
                      
                      <div className="space-y-3 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                        {(tasks || []).map((task, index) => (
                          /* @ts-expect-error - Draggable types may mismatch with React 19 */
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "group flex flex-col gap-2 p-3 rounded-xl transition-all border border-transparent backdrop-blur-sm",
                                  task.id === currentTaskId 
                                    ? "bg-neutral-900 border-white/5 shadow-[0_0_20px_rgba(34,211,238,0.05)]" 
                                    : "bg-neutral-900/20 hover:bg-neutral-900/40",
                                  snapshot.isDragging && "bg-neutral-800 scale-[1.02] shadow-2xl z-50 border-white/10"
                                )}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="flex items-center justify-center p-1 cursor-grab active:cursor-grabbing text-neutral-700 hover:text-neutral-500 transition-colors">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setCurrentTaskId(task.id);
                                      if (!isRunning) {
                                        setTimerMode("focus");
                                        setTimeLeft(focusDuration * 60);
                                      }
                                    }}
                                    className="flex-1 text-left min-w-0"
                                  >
                                    <p className={cn(
                                      "text-sm font-bold truncate transition-colors",
                                      task.id === currentTaskId ? "text-primary-cyan" : "text-neutral-500 group-hover:text-neutral-300"
                                    )}>
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <div className={cn(
                                        "w-1 h-1 rounded-full",
                                        task.id === currentTaskId && "shadow-[0_0_8px_rgba(34,211,238,1)]",
                                        task.priority === Priority.HIGH ? "bg-red-500" :
                                        task.priority === Priority.MEDIUM ? "bg-yellow-500" : "bg-green-500"
                                      )} />
                                      <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">
                                        {(task.subTasks || []).length} Sub-tasks • {(task.subTasks || []).reduce((acc, st) => acc + st.estimatedMinutes, 0)}m
                                      </span>
                                    </div>
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-neutral-700 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Sub-tasks Detailed Section */}
                                {task.id === currentTaskId && (task.subTasks || []).length > 0 && (
                                  <div className="mt-2 space-y-1.5 border-t border-white/5 pt-2">
                                    {(task.subTasks || []).map((st) => (
                                      <div key={st.id} className="flex items-center justify-between group/st">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className={cn(
                                            "w-1.5 h-1.5 rounded-sm border border-white/10 shrink-0",
                                            st.completed ? "bg-primary-cyan/40 border-primary-cyan/20" : "bg-neutral-800"
                                          )} />
                                          <span className={cn(
                                            "text-[10px] truncate",
                                            st.completed ? "text-neutral-600 line-through" : "text-neutral-400"
                                          )}>
                                            {st.title}
                                          </span>
                                        </div>
                                        <span className="text-[9px] font-mono text-neutral-700">{st.estimatedMinutes}m</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Progress Bar Visualization */}
                                <div className="flex gap-1 h-1 w-full mt-2">
                                  {(task.subTasks || []).map((st, i) => (
                                    <div 
                                      key={i} 
                                      className={cn(
                                        "flex-1 rounded-full transition-all duration-500",
                                        st.completed ? "bg-primary-cyan/60" : "bg-neutral-800"
                                      )}
                                      title={`${st.title} (${st.estimatedMinutes}m)`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {(tasks || []).length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-xs text-neutral-700 font-medium italic">Empty list.</p>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>

                      <div className="pt-6 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-primary-cyan animate-pulse" />
                             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Active Task Velocity</span>
                          </div>
                          <span className="text-[10px] font-bold text-white tabular-nums tracking-[0.1em]">
                            {activeTask ? `${activeTask.completedBlocks}/${(activeTask.subTasks || []).length} Units` : "Stable"}
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-900/50 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${activeTask ? (activeTask.completedBlocks / ((activeTask.subTasks || []).length || 1)) * 100 : 0}%` }}
                              className="h-full bg-primary-cyan rounded-full shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-1000"
                            />
                        </div>
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">milestone completion</span>
                           <span className="text-[10px] font-bold text-neutral-400 font-mono">
                             {activeTask ? Math.round((activeTask.completedBlocks / ((activeTask.subTasks || []).length || 1)) * 100) : 0}%
                           </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Small & Minimal Music Widget - Bottom Left */}
              <div className="md:absolute md:bottom-12 md:left-12 w-full max-w-sm md:w-auto p-6 md:p-0 mt-auto md:mt-0">
                <div className="bg-neutral-900/40 hover:bg-neutral-900/60 transition-colors backdrop-blur-md border border-white/5 rounded-2xl p-3 md:p-4 flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-primary-cyan/10 rounded-xl flex items-center justify-center shrink-0 border border-primary-cyan/20 cursor-pointer">
                    <Music className="w-5 h-5 text-primary-cyan group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-[0.2em] mb-0.5">Atmosphere</p>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1 h-1 rounded-full bg-primary-cyan animate-pulse shrink-0" />
                      <p className="text-xs font-bold truncate text-neutral-400">Deep Forest Rain</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 flex-none bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-full flex items-center justify-center border border-white/5 ml-auto md:ml-0">
                    <Pause className="w-3 h-3 fill-current text-white" />
                  </button>
                </div>
              </div>

              {/* Floating Action Menu */}
              <div className="fixed bottom-24 right-8 md:bottom-12 md:right-12 z-50">
                <AnimatePresence>
                  {isFabOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      className="absolute bottom-20 right-0 flex flex-col gap-3 min-w-[220px]"
                    >
                      <button 
                        onClick={() => { setActiveModal("ai"); setIsFabOpen(false); }}
                        className="flex items-center justify-between p-5 bg-neutral-950 border border-white/10 rounded-2xl text-left hover:bg-neutral-900 hover:border-primary-cyan/50 transition-all group shadow-2xl"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">AI Organise</span>
                          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Quick Briefing</span>
                        </div>
                        <Sparkles className="w-5 h-5 text-primary-cyan group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => { setActiveModal("manual"); setIsFabOpen(false); }}
                        className="flex items-center justify-between p-5 bg-neutral-950 border border-white/10 rounded-2xl text-left hover:bg-neutral-900 hover:border-white/30 transition-all group shadow-2xl"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">Manual Add</span>
                          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Single Entry</span>
                        </div>
                        <Plus className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => setIsFabOpen(!isFabOpen)}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all bg-neutral-950 border border-primary-cyan/40 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] relative overflow-hidden group",
                    isFabOpen && "rotate-45 scale-110 border-primary-cyan shadow-[0_0_60px_rgba(34,211,238,0.6)]"
                  )}
                >
                  <div className="absolute inset-0 bg-primary-cyan/5 group-hover:bg-primary-cyan/10 transition-colors" />
                  <Plus className={cn("w-8 h-8 transition-colors", isFabOpen ? "text-primary-cyan" : "text-primary-cyan/80")} />
                </button>
              </div>

              {/* Modals for FAB Actions */}
              <AnimatePresence>
                 {activeModal && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveModal(null)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl overflow-hidden"
                      >
                        {activeModal === "ai" ? (
                          <div className="space-y-8">
                             <div>
                                <h3 className="text-3xl font-bold mb-2">AI Briefing</h3>
                                <p className="text-neutral-500 text-sm">Let AI design your structural session flow.</p>
                             </div>
                             <textarea 
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                placeholder="What tasks do you have on your mind today? Don't worry about order, just brain dump here..."
                                className="w-full h-48 bg-neutral-950 border border-white/5 rounded-2xl p-6 text-lg outline-none focus:border-primary-cyan transition-all resize-none"
                             />
                             <div className="flex gap-4">
                                <button 
                                  onClick={handleOrganize}
                                  disabled={isAiLoading || !aiInput.trim()}
                                  className="flex-1 h-16 bg-primary-blue text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary-blue/90 disabled:opacity-50 transition-all font-sans"
                                >
                                  {isAiLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Process Intent <Sparkles className="w-5 h-5" /></>}
                                </button>
                                <button 
                                  onClick={() => setActiveModal(null)}
                                  className="px-8 h-16 bg-neutral-800 text-neutral-400 rounded-2xl font-bold hover:bg-neutral-700 transition-colors"
                                >
                                  Cancel
                                </button>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                             <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-3xl font-bold mb-2">Workspace Manager</h3>
                                  <p className="text-neutral-500 text-sm">Manage your manual tasks and session order.</p>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><RotateCcw className="w-5 h-5 rotate-45" /></button>
                             </div>

                             <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                {/* Manual Add Form */}
                                <form onSubmit={handleAddTask} className="flex flex-col gap-4 p-6 bg-neutral-950/50 border border-white/5 rounded-2xl">
                                   <input 
                                      value={newTaskTitle}
                                      onChange={(e) => setNewTaskTitle(e.target.value)}
                                      placeholder="Session goal..."
                                      className="bg-transparent border-none text-xl font-bold outline-none placeholder:text-neutral-700"
                                   />
                                   <div className="flex gap-4 items-center">
                                      <select 
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                                        className="bg-neutral-900 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none"
                                      >
                                        <option value={Priority.LOW}>Low</option>
                                        <option value={Priority.MEDIUM}>Med</option>
                                        <option value={Priority.HIGH}>High</option>
                                      </select>
                                      <div className="h-4 w-[1px] bg-neutral-800" />
                                      <div className="flex items-center gap-2">
                                         <Clock className="w-3 h-3 text-neutral-500" />
                                         <input 
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={newTaskBlocks}
                                            onChange={(e) => setNewTaskBlocks(parseInt(e.target.value))}
                                            className="bg-transparent border-none text-[10px] font-bold w-6 outline-none"
                                         />
                                      </div>
                                      <button type="submit" disabled={!newTaskTitle.trim()} className="ml-auto p-2 bg-white text-neutral-950 rounded-lg hover:scale-105 transition-all disabled:opacity-30">
                                         <Plus className="w-4 h-4" />
                                      </button>
                                   </div>
                                </form>

                                {/* Reorderable Task List */}
                                <DragDropContext onDragEnd={onDragEnd}>
                                  <Droppable droppableId="modal-tasks">
                                    {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                         {(tasks || []).map((task, index) => (
                                           // @ts-ignore
                                           <Draggable key={task.id} draggableId={task.id} index={index}>
                                             {(dragProvided) => (
                                                <div 
                                                  ref={dragProvided.innerRef}
                                                  {...dragProvided.draggableProps}
                                                  className={cn(
                                                    "flex items-center gap-4 p-4 bg-neutral-950/30 border border-white/5 rounded-xl transition-all group",
                                                    task.id === currentTaskId && "border-primary-cyan/30"
                                                  )}
                                                >
                                                  <div {...dragProvided.dragHandleProps} className="text-neutral-700"><GripVertical className="w-4 h-4" /></div>
                                                  <div 
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => { setCurrentTaskId(task.id); setActiveModal(null); setTimerMode("focus"); setTimeLeft(focusDuration * 60); }}
                                                  >
                                                    <p className={cn("font-bold text-sm truncate", task.id === currentTaskId ? "text-primary-cyan" : "text-neutral-400 group-hover:text-white")}>{task.title}</p>
                                                  </div>
                                                  <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-neutral-700 hover:text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                             )}
                                           </Draggable>
                                         ))}
                                         {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                             </div>
                          </div>
                        )}
                      </motion.div>
                   </div>
                 )}
              </AnimatePresence>
            </motion.div>
          )}



          {activeScreen === "rewards" && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar"
            >
              <div id="stats-dashboard" className="max-w-6xl mx-auto space-y-10">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">Performance Analytics</h2>
                    <p className="text-neutral-500 font-medium tracking-wide">Visualize your productivity patterns and deep work sessions.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={exportPDF}
                      className="flex items-center gap-2 px-5 py-3 bg-neutral-900 border border-white/10 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-neutral-800 transition-all group"
                    >
                      <FileDown className="w-4 h-4 text-primary-cyan group-hover:scale-110 transition-transform" />
                      Export Report
                    </button>
                    <button 
                      onClick={() => setActiveScreen("workspace")}
                      className="px-5 py-3 bg-neutral-50 text-neutral-950 rounded-xl font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-all"
                    >
                      Resume Focus
                    </button>
                  </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    icon={<Flame className="w-5 h-5 text-orange-500" />} 
                    label="Focus Streak" 
                    value={`${stats.streak} Days`} 
                    subValue="Consistently high"
                  />
                  <StatCard 
                    icon={<Zap className="w-5 h-5 text-primary-cyan" />} 
                    label="Deep Work" 
                    value={`${stats.deepWorkMinutes}m`} 
                    subValue="Time in Zen Space"
                  />
                  <StatCard 
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />} 
                    label="Violations" 
                    value={stats.violations} 
                    subValue="Procrastination hits"
                  />
                  <StatCard 
                    icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} 
                     label="Tasks Completed" 
                    value={stats.tasksFinished} 
                    subValue="Overall productivity"
                  />
                </div>

                {/* Primary Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-neutral-900/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold tracking-widest uppercase text-xs text-neutral-500">Focus Distribution by Category</h3>
                      <div className="flex gap-4">
                        {stats.categoryDeepWork.map((cat, i) => (
                           <div key={i} className="flex items-center gap-1.5">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? "#22d3ee" : i === 1 ? "#8b5cf6" : "#10b981" }} />
                             <span className="text-[10px] font-bold text-neutral-400 uppercase">{cat.category}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.categoryDeepWork}>
                          <defs>
                            <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0a0a0a", borderContent: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                            itemStyle={{ color: "#22d3ee", fontWeight: "bold" }}
                          />
                          <Area type="monotone" dataKey="minutes" stroke="#22d3ee" fillOpacity={1} fill="url(#colorMin)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-neutral-900/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm flex flex-col">
                    <h3 className="font-bold tracking-widest uppercase text-xs text-neutral-500 mb-8">Deep Work Ratio</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                       <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Deep Work", value: stats.deepWorkMinutes },
                                  { name: "Breaks/Distraction", value: stats.breakMinutes }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                <Cell fill="#22d3ee" />
                                <Cell fill="rgba(255,255,255,0.05)" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="text-center mt-4">
                         <p className="text-3xl font-bold">{Math.round((stats.deepWorkMinutes / (stats.deepWorkMinutes + stats.breakMinutes)) * 100)}%</p>
                         <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Efficiency Index</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Row: Violation Analytics & Rewards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-neutral-900/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold tracking-widest uppercase text-xs text-neutral-500">Violation Hotspots</h3>
                        <AlertTriangle className="w-4 h-4 text-neutral-700" />
                      </div>
                      <div className="space-y-4">
                         {stats.violationHistory.map((v, i) => (
                           <div key={i} className="flex items-center gap-4">
                             <span className="text-xs font-bold text-neutral-400 w-32 truncate">{v.taskTitle}</span>
                             <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                               <div className="h-full bg-red-500/50" style={{ width: `${(v.violations / 5) * 100}%` }} />
                             </div>
                             <span className="text-xs font-mono text-neutral-600">{v.violations} hits</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-neutral-900/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold tracking-widest uppercase text-xs text-neutral-500">Reward Collections</h3>
                        <Trophy className="w-4 h-4 text-primary-cyan" />
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-4 bg-primary-cyan/5 border border-primary-cyan/10 rounded-2xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Next Unlock: "Glass Canvas"</span>
                            <span className="text-[10px] font-bold">12/15 Cycles</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]" style={{ width: "80%" }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                           {["Clay", "Cyber", "Zen", "Mono", "Forest", "Rain", "Focus", "Track"].map((reward, i) => (
                             <div 
                                key={i} 
                                className={cn(
                                  "aspect-square rounded-xl flex items-center justify-center border transition-all",
                                  i < 4 ? "bg-primary-cyan/10 border-primary-cyan/20 text-primary-cyan" : "bg-neutral-950 border-white/5 text-neutral-800"
                                )}
                             >
                                <Zap className="w-5 h-5" />
                             </div>
                           ))}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeScreen === "settings" && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto custom-scrollbar h-full"
            >
              <div className="max-w-5xl mx-auto flex flex-col h-full">
                {/* Horizontal Tab Header */}
                <div className="px-4 md:px-16 pt-8 md:pt-16 pb-0 space-y-10 shrink-0 w-full max-w-full overflow-hidden">
                  <header className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-white/90">Settings</h2>
                    <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-[0.3em]">Configure Atmosphere & Essence</p>
                  </header>
                  
                  <div className="relative w-full overflow-hidden">
                    <nav className="flex items-center p-1 bg-neutral-900/50 rounded-2xl border border-white/5 gap-1 overflow-x-auto scrollbar-hide w-full max-w-full">
                    {[
                      { id: "focus", label: "Focus", icon: <Target className="w-3.5 h-3.5" /> },
                      { id: "zen", label: "Zen", icon: <Music className="w-3.5 h-3.5" /> },
                      { id: "appearance", label: "Identity", icon: <Palette className="w-3.5 h-3.5" /> },
                      { id: "account", label: "Ecosystem", icon: <User className="w-3.5 h-3.5" /> },
                      { id: "procrastination", label: "Library", icon: <Library className="w-3.5 h-3.5" /> }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all whitespace-nowrap text-[11px] font-black uppercase tracking-wider relative group",
                          settingsTab === tab.id 
                            ? "text-neutral-950" 
                            : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        {settingsTab === tab.id && (
                          <motion.div 
                            layoutId="activeSettingsTab"
                            className="absolute inset-0 bg-primary-cyan rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                          />
                        )}
                        <div className={cn(
                          "flex items-center justify-center transition-all relative z-10",
                          settingsTab === tab.id ? "text-neutral-950 scale-110" : "opacity-50 group-hover:opacity-100"
                        )}>
                          {tab.icon}
                        </div>
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Settings Content Area */}
              <main className="flex-1 p-4 sm:p-8 md:p-16 pt-10 overflow-y-auto w-full max-w-full">
                  <AnimatePresence mode="wait">
                    {settingsTab === "focus" && (
                      <motion.section 
                        key="focus"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold">Focus Engine</h3>
                          <p className="text-neutral-500 text-sm">Fine-tune the temporal logic of your concentration sessions.</p>
                        </div>
                        <div className="bg-neutral-900/30 border border-white/5 rounded-[2.5rem] p-6 md:p-10 space-y-10">
                          <div className="space-y-10">
                            <SettingSlider label="Deep Focus Period" value={focusDuration} unit="min" onChange={setFocusDuration} min={5} max={90} />
                            <SettingSlider label="Micro Break" value={breakDuration} unit="min" onChange={setBreakDuration} min={1} max={15} />
                            <SettingSlider label="Macro Recovery" value={longBreakDuration} unit="min" onChange={setLongBreakDuration} min={5} max={45} />
                          </div>
                          <div className="pt-10 border-t border-white/5">
                            <SettingToggle 
                              icon={<RefreshCw className="w-4 h-4" />}
                              label="Seamless Transitions" 
                              description="Automatically bridge focus blocks to maintain cognitive momentum."
                              active={autoStart}
                              onClick={() => setAutoStart(!autoStart)}
                            />
                          </div>
                        </div>
                      </motion.section>
                    )}

                    {settingsTab === "zen" && (
                      <motion.section 
                        key="zen"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold">Zen Environment</h3>
                          <p className="text-neutral-500 text-sm">Configure sensory inputs to foster an immersive focus stage.</p>
                        </div>
                        <div className="bg-neutral-900/30 border border-white/5 rounded-[2.5rem] p-6 md:p-10 space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {["Lo-Fi Study", "Deep Forest", "White Noise", "Synthwave", "Rainy Night", "Ocean Waves"].map((track) => (
                              <button 
                                key={track}
                                onClick={() => setSelectedMusic(track)}
                                className={cn(
                                  "flex items-center justify-between p-5 rounded-2xl border transition-all text-left",
                                  selectedMusic === track 
                                    ? "bg-violet-500/10 border-violet-500/30 text-violet-100" 
                                    : "bg-neutral-950 border-white/5 text-neutral-500 hover:border-white/10"
                                )}
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-bold">{track}</p>
                                  <p className="text-[10px] uppercase font-bold opacity-40">Ambient Track</p>
                                </div>
                                <Volume2 className={cn("w-4 h-4", selectedMusic === track ? "opacity-100" : "opacity-10")} />
                              </button>
                            ))}
                          </div>
                          <div className="p-8 bg-black/40 rounded-3xl border border-white/5">
                            <SettingToggle 
                              icon={<BellOff className="w-4 h-4" />}
                              label="Cognitive Silencer" 
                              description="Leverage OS API to suppress all incoming disturbances during active focus."
                              active={isSilencerActive}
                              onClick={() => setIsSilencerActive(!isSilencerActive)}
                            />
                          </div>
                        </div>
                      </motion.section>
                    )}

                    {settingsTab === "appearance" && (
                      <motion.section 
                        key="appearance"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                         <div className="space-y-4">
                            <h3 className="text-2xl font-bold">Visual Identity</h3>
                            <p className="text-neutral-500 text-sm">Personalize your workspace aesthetic and accessibility parameters.</p>
                          </div>
                          <div className="bg-neutral-900/30 border border-white/5 rounded-[2.5rem] p-6 md:p-10 space-y-10">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {["Clay", "Cyber", "Zen", "Mono"].map((theme) => (
                                  <button 
                                    key={theme}
                                    onClick={() => setSelectedTheme(theme)}
                                    className={cn(
                                      "aspect-video rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group",
                                      selectedTheme === theme ? "border-primary-cyan ring-4 ring-primary-cyan/10 shadow-2xl shadow-primary-cyan/20" : "border-white/5 grayscale opacity-40 hover:opacity-100"
                                    )}
                                  >
                                    <div className={cn("absolute inset-0 bg-gradient-to-br transition-all group-hover:scale-110", theme === "Clay" ? "from-neutral-800 to-neutral-950" : "from-neutral-950 to-neutral-800")} />
                                    <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em]">{theme}</span>
                                    {stats.unlockedRewards.includes(`${theme} Theme`) ? null : (
                                      <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                                        <Lock className="w-4 h-4 text-white/40" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                            </div>
                            <div className="space-y-12 pt-6 border-t border-white/5">
                               <SettingSlider label="Interface Scale" value={fontSize} unit="%" onChange={setFontSize} min={80} max={150} />
                               <SettingToggle 
                                icon={<Type className="w-4 h-4" />}
                                label="High Contrast Precision" 
                                description="Deepen levels of visual separation for critical lighting environments."
                                active={highContrast}
                                onClick={() => setHighContrast(!highContrast)}
                              />
                            </div>
                          </div>
                      </motion.section>
                    )}

                    {settingsTab === "account" && (
                      <motion.section 
                        key="account"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                         <div className="space-y-4">
                            <h3 className="text-2xl font-bold">Cloud Presence</h3>
                            <p className="text-neutral-500 text-sm">Identity management and multi-device synchronization settings.</p>
                          </div>
                          <div className="bg-neutral-900/30 border border-white/5 rounded-[2.5rem] p-6 md:p-10">
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                              <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-cyan to-violet-500 p-1">
                                  <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center overflow-hidden">
                                    <span className="text-3xl font-bold text-white">SS</span>
                                  </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-neutral-950 rounded-full flex items-center justify-center">
                                   <RefreshCw className="w-4 h-4 text-white animate-spin-slow" />
                                </div>
                              </div>
                              <div className="flex-1 text-center md:text-left space-y-1">
                                <h4 className="text-2xl font-bold tracking-tight">Sushant Shrestha</h4>
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                  <span className="px-2 py-0.5 bg-primary-cyan/10 text-primary-cyan text-[10px] font-bold uppercase rounded-md">Pro Member</span>
                                  <span className="w-1 h-1 rounded-full bg-neutral-700" />
                                  <p className="text-neutral-500 text-sm font-medium">Syncing globally</p>
                                </div>
                              </div>
                              <button className="px-8 py-4 bg-white text-neutral-950 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-white/5">
                                Upgrade Plan
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10 border-t border-white/5">
                              <button className="flex items-center gap-5 p-6 bg-neutral-950 border border-white/5 rounded-[2rem] hover:border-primary-cyan/30 transition-all text-left group">
                                <div className="w-12 h-12 rounded-2xl bg-primary-cyan/10 flex items-center justify-center text-primary-cyan group-hover:scale-110 transition-transform">
                                  <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold">Cloud Security</p>
                                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-1">E2E Encrypted</p>
                                </div>
                              </button>
                              <button className="flex items-center gap-5 p-6 bg-neutral-950 border border-white/5 rounded-[2rem] hover:border-violet-400/30 transition-all text-left group">
                                <div className="w-12 h-12 rounded-2xl bg-violet-400/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                                  <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold">Billing History</p>
                                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-1">Next Payment: May 28</p>
                                </div>
                              </button>
                            </div>
                          </div>
                      </motion.section>
                    )}

                    {settingsTab === "procrastination" && (
                      <motion.section 
                        key="procrastination"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold">The Library</h3>
                          <p className="text-neutral-500 text-sm">Philosophical foundations and tactical logic to defeat procrastination.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                           <TipCard 
                            title="The 5-Minute Rule" 
                            description="Commit to working for just 5 minutes. Usually, the momentum carries you through several cycles." 
                            category="Focus Strategy"
                           />
                           <TipCard 
                            title="Environment Priming" 
                            description="Clear your desk and close unnecessary browser tabs before the timer starts." 
                            category="Habit Design"
                           />
                           <TipCard 
                            title="Identifying Hotspots" 
                            description="Look at your violations. If 'Research' always leads to distraction, break it into smaller blocks." 
                            category="Data Insights"
                           />
                           <TipCard 
                            title="Temptation Bundling" 
                            description="Only listen to your favorite 'Clay' tracks when you are in a Deep Focus session." 
                            category="Motivation"
                           />
                        </div>
                      </motion.section>
                    )}
                  </AnimatePresence>
                </main>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Mobile Nav - Bottom Bar */}
      <nav className="md:hidden flex bg-neutral-950 border-t border-white/5 p-4 pb-10 justify-around items-center sticky bottom-0 z-30">
        <MobileNavButton active={activeScreen === "workspace"} onClick={() => setActiveScreen("workspace")} icon={<Target className="w-6 h-6" />} />
        <MobileNavButton active={activeScreen === "rewards"} onClick={() => setActiveScreen("rewards")} icon={<Trophy className="w-6 h-6" />} />
        <MobileNavButton active={activeScreen === "settings"} onClick={() => setActiveScreen("settings")} icon={<Settings className="w-6 h-6" />} />
      </nav>
    </div>
  );
}

function SettingSlider({ label, value, unit, onChange, min, max }: { label: string; value: number; unit: string; onChange: (val: number) => void; min: number; max: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-neutral-300">{label}</span>
        <span className="text-sm font-mono text-primary-cyan">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-cyan"
      />
    </div>
  );
}

function SettingToggle({ icon, label, description, active, onClick }: { icon: React.ReactNode; label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 group transition-all"
    >
      <div className="flex items-center gap-3 md:gap-4 text-left min-w-0">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all", active ? "bg-primary-cyan/10 text-primary-cyan" : "bg-neutral-800 text-neutral-500")}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-neutral-200 truncate md:whitespace-normal">{label}</p>
          <p className="text-[10px] text-neutral-500 font-medium line-clamp-2 md:line-clamp-none">{description}</p>
        </div>
      </div>
      <div className={cn("w-12 h-6 rounded-full shrink-0 relative transition-all", active ? "bg-primary-cyan" : "bg-neutral-800")}>
        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", active ? "right-1" : "left-1")} />
      </div>
    </button>
  );
}

function TipCard({ title, description, category }: { title: string; description: string; category: string }) {
  return (
    <div className="bg-neutral-900/30 border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group">
      <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-2">{category}</p>
      <h4 className="text-sm font-bold text-neutral-200 mb-2 group-hover:text-amber-400 transition-colors">{title}</h4>
      <p className="text-xs text-neutral-500 leading-relaxed font-normal">{description}</p>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string | number; subValue: string }) {
  return (
    <div className="bg-neutral-900 border border-white/5 p-6 rounded-[1.5rem] flex flex-col gap-4 group hover:border-white/10 transition-all shadow-xl">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
        <p className="text-[10px] text-neutral-600 font-medium uppercase tracking-wide">{subValue}</p>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick?: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold border border-transparent text-sm uppercase tracking-widest",
        active ? "bg-white/5 text-white border-white/10 shadow-lg shadow-black/20" : "text-neutral-500 hover:text-neutral-300"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active && "text-primary-cyan")}>{icon}</span>
      <span>{label}</span>
      {active && <motion.div layoutId="nav-pill" className="ml-auto w-1 h-1 bg-primary-cyan rounded-full shadow-[0_0_8px_rgba(34,211,238,1)]" />}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative p-3 transition-all",
        active ? "text-primary-cyan scale-110" : "text-neutral-600"
      )}
    >
      {icon}
      {active && (
        <motion.div 
          layoutId="mobile-nav-indicator"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-cyan rounded-full shadow-[0_0_8px_rgba(34,211,238,1)]"
        />
      )}
    </button>
  );
}
