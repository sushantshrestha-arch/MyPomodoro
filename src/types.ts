export enum Priority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export interface TaskStats {
  category: string;
  minutes: number;
}

export interface ViolationData {
  taskTitle: string;
  violations: number;
}

export interface SessionStats {
  focusTime: number; // in minutes
  tasksFinished: number;
  streak: number;
  deepWorkMinutes: number;
  breakMinutes: number;
  violations: number;
  categoryDeepWork: TaskStats[];
  violationHistory: ViolationData[];
  unlockedRewards: string[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  estimatedBlocks: number;
  completedBlocks: number;
  subTasks: SubTask[];
  category?: string;
}

export type Screen = "workspace" | "rewards" | "settings";

export type TimerMode = "focus" | "break";
