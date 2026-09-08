export type StepType = 'safe' | 'caution' | 'warning' | 'danger';

export type SignalLevel = 'normal' | 'warning' | 'danger';

export interface DetectedSignal {
  category: string;
  level: SignalLevel;
  count: number;
  examples: string[];
}

export interface ComplaintRecord {
  id: number | string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  dept: string;
  content: string;
  emotionScore: number;
  urgencyScore: number;
  compositeScore: number;
  step: StepType;
  hasThreat: boolean;
  hasProfanity?: boolean;
  detectedSignals: DetectedSignal[];
  foundWords: string[];
}

export interface SignalRule {
  category: string;
  level: SignalLevel;
  weightEmotion: number;
  weightUrgency: number;
  keywords: string[];
}

export interface FilterState {
  keyword: string;
  dept: string;
  step: string;
  date: string;
}

export interface TrendInfo {
  isRising: boolean;
  count: number;
}
