export type Symptom = 'tired' | 'anxious' | 'brain fog' | 'good' | 'hot flashes' | 'insomnia' | 'mood swings';

export interface PlanItem {
  id: string;
  type: 'exercise' | 'nutrition' | 'lifestyle';
  title: string;
  description: string;
  productRecommendation?: {
    name: string;
    image: string;
    link: string;
  };
}

export interface DailyPlan {
  date: string;
  focus: string;
  items: PlanItem[];
}

export interface Insight {
  id: string;
  text: string;
  type: 'positive' | 'observation';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  rewardType?: 'virtual' | 'real';
  rewardValue?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  timestamp: number; // Added for easier filtering
  exercise?: {
    type: string;
    duration: number;
    intensity: 'low' | 'medium' | 'high';
  }[];
  nutrition?: {
    meal: string;
    tags: string[];
    image?: string;
    aiAnalysis?: string;
    weight?: string;
  }[];
  symptom?: Symptom;
  mood?: string;
}

export interface AvatarState {
  base: string;
  accessories: string[];
  unlockedAccessories: string[];
}

export interface UserPreferences {
  autoAdaptPlan: boolean;
  notificationsEnabled: boolean;
  avatar: AvatarState;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
