import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  Home, 
  Calendar, 
  BarChart2, 
  Award, 
  MessageCircle, 
  ChevronRight, 
  Moon, 
  Sun, 
  Wind, 
  Coffee, 
  Activity,
  User as UserIcon,
  Send,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  Settings,
  Layout,
  List as ListIcon,
  Plus,
  Utensils,
  Dumbbell,
  Smile,
  Zap,
  Heart,
  Clock,
  Shirt,
  Gem,
  Lock,
  ShieldCheck,
  Camera,
  ArrowLeft,
  Apple,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { getPeriHerResponse } from './services/gemini';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { Symptom, PlanItem, DailyPlan, Insight, Achievement, Message, UserPreferences, DailyLog, AvatarState } from './types';

// --- Mock Data ---
const WEEKLY_PLAN: any[] = [
  { 
    id: '1', 
    type: 'exercise', 
    title: '20-minute Strength Training', 
    description: 'Targeted strength training to boost metabolism and maintain bone density during perimenopause.', 
    color: 'bg-sage-50',
    text: 'text-sage-500',
    icon: Dumbbell,
    productRecommendation: { name: 'Resistance Band Set', image: 'https://picsum.photos/seed/bands/200/200', link: '#' },
    workoutSteps: [
      'Warm up: 5 mins of brisk walking or arm circles.',
      'Banded Squats: 3 sets of 15 reps.',
      'Banded Rows: 3 sets of 12 reps.',
      'Banded Chest Press: 3 sets of 12 reps.',
      'Stretching: 5 mins focusing on large muscle groups.'
    ],
    tutorialLink: 'https://www.youtube.com/results?search_query=strength+training+for+perimenopause'
  },
  { 
    id: '2', 
    type: 'nutrition', 
    title: 'High-Protein Breakfast', 
    description: 'Greek yogurt with berries and flaxseeds. Supports stable energy and muscle maintenance.', 
    color: 'bg-rose-50',
    text: 'text-rose-500',
    icon: Apple,
    productRecommendation: { name: 'Plant-based Protein', image: 'https://picsum.photos/seed/protein/200/200', link: '#' },
    ingredients: ['1 cup Greek Yogurt (unsweetened)', '1/2 cup Mixed Berries', '2 tbsp Ground Flaxseeds', '1 tbsp Almond Slivers', 'Drizzle of honey (optional)'],
    recipeSteps: [
      'Scoop yogurt into a serving bowl.',
      'Wash and dry berries, then place on top of yogurt.',
      'Sprinkle flaxseeds and almonds evenly.',
      'Mix slightly or layers for texture.',
      'Enjoy immediately with a glass of water.'
    ]
  },
  { 
    id: '3', 
    type: 'lifestyle', 
    title: 'Sleep Routine', 
    description: 'No screens 30 mins before bed. Lavender mist. Essential for hormone regulation.',
    color: 'bg-blue-50',
    text: 'text-blue-500',
    icon: Wind,
    workoutSteps: [
      'Set a "digital sunset" alarm for 9 PM.',
      'Dim the lights in the living area.',
      'Gentle stretching for 5 minutes.',
      'Spray lavender mist on pillow.',
      'Read 10 pages of a physical book.'
    ]
  },
  { 
    id: '4', 
    type: 'exercise', 
    title: '30-minute Brisk Walk', 
    description: 'Get some fresh air and vitamin D. Helps regulate circadian rhythm and mood.',
    color: 'bg-sage-50',
    text: 'text-sage-500',
    icon: Dumbbell,
    workoutSteps: [
      'Shoes on and head outside.',
      'First 5 mins: Moderate pace.',
      'Next 20 mins: Brisk pace (able to talk but not sing).',
      'Final 5 mins: Slow down to cool down.',
      'Deep breaths: 2 mins of rhythmic breathing.'
    ],
    tutorialLink: 'https://www.youtube.com/results?search_query=benefits+of+walking+menopause'
  },
  { 
    id: '5', 
    type: 'nutrition', 
    title: 'Magnesium-Rich Dinner', 
    description: 'Spinach, pumpkin seeds, and salmon. Eases muscle tension and promotes deep sleep.',
    color: 'bg-rose-50',
    text: 'text-rose-500',
    icon: Apple,
    ingredients: ['1 Salmon fillet', '2 cups baby spinach', '1/4 cup pumpkin seeds', 'Lemon juice', 'Sea salt'],
    recipeSteps: [
      'Bake salmon at 400°F (200°C) for 12-15 mins.',
      'Steam spinach for 2 mins until bright green.',
      'Toast pumpkin seeds until golden.',
      'Assemble salmon on a bed of spinach.',
      'Top with seeds and a squeeze of fresh lemon.'
    ]
  },
];

const INSIGHTS: Insight[] = [];

const ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'Symptom Streak', description: 'Complete your first day of symptom tracking', icon: '🔥', progress: 0, target: 7, completed: false },
  { id: '2', title: 'Workout Warrior', description: 'Complete 3 workouts per week', icon: '💪', progress: 0, target: 3, completed: false },
  { id: '3', title: 'Sleep Milestone', description: 'Average 7.5h sleep this week', icon: '🌙', progress: 0, target: 8, completed: false },
];

const CHART_DATA: any[] = [];

// --- Components ---

const Avatar = ({ state, size = "md", mood = "calm", trigger = 0 }: { state: AvatarState, size?: "sm" | "md" | "lg", mood?: 'calm' | 'stressed' | 'energetic', trigger?: number }) => {
  const sizes = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const colors = {
    calm: "from-lavender-300 to-blue-200",
    stressed: "from-rose-300 to-orange-200",
    energetic: "from-emerald-300 to-yellow-200"
  };

  const glowColors = {
    calm: "rgba(167, 139, 250, 0.3)",
    stressed: "rgba(251, 113, 133, 0.3)",
    energetic: "rgba(52, 211, 153, 0.3)"
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size])}>
      {/* Glow Effect */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ backgroundColor: glowColors[mood] }}
      />

      {/* Main Blob Body */}
      <motion.div
        key={trigger}
        animate={{
          scale: [1, 1.05, 1],
          y: [0, -8, 0],
          borderRadius: [
            "45% 55% 60% 40% / 40% 45% 55% 60%",
            "55% 45% 40% 60% / 60% 55% 45% 40%",
            "45% 55% 60% 40% / 40% 45% 55% 60%"
          ],
        }}
        transition={{
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          borderRadius: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className={cn(
          "w-full h-full bg-gradient-to-br shadow-lg border-2 border-white/40 backdrop-blur-sm relative overflow-hidden",
          colors[mood]
        )}
      >
        {/* Inner Light Reflection */}
        <div className="absolute top-2 left-4 w-1/3 h-1/4 bg-white/30 rounded-full blur-sm rotate-[-20deg]" />
        
        {/* Subtle Eyes (Headspace style) */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 mt-[-10%]">
          <motion.div 
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            className="w-1.5 h-1.5 bg-slate-800/60 rounded-full" 
          />
          <motion.div 
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            className="w-1.5 h-1.5 bg-slate-800/60 rounded-full" 
          />
        </div>

        {/* Accessories Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {state.accessories.map((acc, i) => (
            <div key={i} className="absolute inset-0 flex items-center justify-center">
              {acc === 'glasses' && (
                <div className="flex gap-1 mt-[-10%]">
                  <div className="w-4 h-4 border-2 border-slate-800/40 rounded-full" />
                  <div className="w-1 h-0.5 bg-slate-800/40 mt-2" />
                  <div className="w-4 h-4 border-2 border-slate-800/40 rounded-full" />
                </div>
              )}
              {acc === 'hat' && <div className="w-3/4 h-1/4 bg-rose-400/80 absolute top-2 rounded-full" />}
              {acc === 'crown' && <Gem size={16} className="text-yellow-500/80 absolute top-1" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sparkles */}
      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8], rotate: [0, 90, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-1 -right-1"
      >
        <Sparkles size={14} className="text-yellow-400" />
      </motion.div>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300",
      active ? "text-lavender-500 scale-110" : "text-slate-400 hover:text-lavender-300"
    )}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">{label}</span>
  </button>
);

const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={cn("bg-white rounded-3xl p-5 shadow-sm border border-warm-200", className)}
  >
    {children}
  </motion.div>
);

// --- Screens ---

const DailyLogging = ({ onLog }: { onLog: (log: Partial<DailyLog>) => void }) => {
  const [step, setStep] = useState<'type' | 'exercise' | 'nutrition'>('type');
  const [exercise, setExercise] = useState<{ type: string, duration: number, intensity: 'low' | 'medium' | 'high' }>({ type: '', duration: 20, intensity: 'medium' });
  const [nutrition, setNutrition] = useState<{ meal: string, tags: string[], image?: string, aiAnalysis?: string, weight?: string }>({ meal: '', tags: [] });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exerciseTypes = ['Walking', 'Yoga', 'Strength', 'Pilates', 'Swimming'];
  const nutritionTags = ['High Protein', 'Comfort Food', 'Low Carb', 'Hydrating', 'Energy Boost'];
  const mealTypes = [
    { id: 'Breakfast', icon: Sun },
    { id: 'Lunch', icon: Sun },
    { id: 'Dinner', icon: Moon },
    { id: 'Snack', icon: Zap },
    { id: 'Hydration', icon: Activity },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setNutrition(prev => ({ ...prev, image: reader.result as string }));

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { text: "Analyze this meal photo. Identify the food items, estimate the total weight in grams, and give a short 2-3 word evaluation (e.g., 'High Protein Comfort'). Also provide a one-sentence feedback/advice for perimenopause wellness. Return as JSON with fields: 'items' (array of strings), 'weight' (string), 'evaluation' (string), 'feedback' (string)." },
              { inlineData: { mimeType: file.type, data: base64 } }
            ]
          },
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text);
        setNutrition(prev => ({
          ...prev,
          tags: [...new Set([...prev.tags, result.evaluation, ...(result.items || [])])],
          aiAnalysis: result.feedback,
          weight: result.weight,
          meal: prev.meal || 'Meal'
        }));
      } catch (error) {
        console.error("AI Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExerciseSubmit = () => {
    onLog({ exercise: [exercise] });
    setStep('type');
  };

  const handleNutritionSubmit = () => {
    onLog({ nutrition: [nutrition] });
    setStep('type');
  };

  return (
    <Card className="p-6 rounded-[2.5rem] glass-noise soft-shadow border-white/40">
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {step === 'type' && (
            <motion.div 
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="serif text-xl font-medium text-slate-800">Log Your Day</h3>
                <Zap size={20} className="text-lavender-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setStep('exercise')}
                  className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-sage-50/50 backdrop-blur-sm text-sage-600 hover:bg-sage-100/50 transition-colors border border-sage-100/50"
                >
                  <Dumbbell size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">Exercise</span>
                </button>
                <button 
                  onClick={() => setStep('nutrition')}
                  className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-rose-50/50 backdrop-blur-sm text-rose-600 hover:bg-rose-100/50 transition-colors border border-rose-100/50"
                >
                  <Utensils size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">Nutrition</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'exercise' && (
            <motion.div 
              key="exercise"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('type')} className="text-slate-400 hover:text-slate-600">
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <h3 className="serif text-xl font-medium text-slate-800">Exercise</h3>
                <div className="w-5" />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {exerciseTypes.map(t => (
                    <button 
                      key={t}
                      onClick={() => setExercise({ ...exercise, type: t })}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-medium transition-all border",
                        exercise.type === t 
                          ? "bg-sage-500 text-white border-sage-400" 
                          : "bg-white/50 text-slate-500 border-white/20 hover:bg-white/80"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Duration</span>
                    <span>{exercise.duration} min</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="120" 
                    step="5"
                    value={exercise.duration}
                    onChange={(e) => setExercise({ ...exercise, duration: parseInt(e.target.value) })}
                    className="w-full accent-sage-400"
                  />
                </div>

                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(i => (
                    <button 
                      key={i}
                      onClick={() => setExercise({ ...exercise, intensity: i })}
                      className={cn(
                        "flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                        exercise.intensity === i 
                          ? "bg-sage-100/80 text-sage-600 border-sage-200" 
                          : "bg-white/30 text-slate-400 border-white/10"
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleExerciseSubmit}
                  disabled={!exercise.type}
                  className="w-full py-4 bg-sage-500 text-white rounded-2xl font-medium soft-shadow disabled:opacity-50"
                >
                  Log Exercise
                </button>
              </div>
            </motion.div>
          )}

          {step === 'nutrition' && (
            <motion.div 
              key="nutrition"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('type')} className="text-slate-400 hover:text-slate-600">
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <h3 className="serif text-xl font-medium text-slate-800">Nutrition</h3>
                <div className="w-5" />
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden",
                      nutrition.image ? "border-rose-200" : "border-slate-200 hover:border-rose-200 bg-slate-50/50"
                    )}
                  >
                    {nutrition.image ? (
                      <>
                        <img src={nutrition.image} alt="Meal" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Camera size={32} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera size={32} className="text-slate-300" />
                        <span className="text-xs text-slate-400 font-medium">Upload Meal Photo for AI Analysis</span>
                      </>
                    )}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent" />
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">AI Analyzing...</span>
                      </div>
                    )}
                  </button>

                  {nutrition.aiAnalysis && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 w-full"
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles size={16} className="text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-rose-700 font-medium leading-relaxed">{nutrition.aiAnalysis}</p>
                          {nutrition.weight && <p className="text-[10px] text-rose-400 mt-1 font-bold uppercase tracking-widest">Est. Weight: {nutrition.weight}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {mealTypes.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setNutrition({ ...nutrition, meal: m.id })}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                        nutrition.meal === m.id
                          ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-100"
                          : "bg-white/40 text-slate-500 border-white/20 hover:bg-white/60"
                      )}
                    >
                      <m.icon size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{m.id}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quick Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {nutritionTags.map(t => (
                      <button 
                        key={t}
                        onClick={() => {
                          const tags = nutrition.tags.includes(t) 
                            ? nutrition.tags.filter(tag => tag !== t)
                            : [...nutrition.tags, t];
                          setNutrition({ ...nutrition, tags });
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium transition-all border",
                          nutrition.tags.includes(t) 
                            ? "bg-rose-500 text-white border-rose-400" 
                            : "bg-white/40 text-slate-500 border-white/20 hover:bg-white/60"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleNutritionSubmit}
                  disabled={!nutrition.meal}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-medium soft-shadow disabled:opacity-50"
                >
                  Log Nutrition
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

const LandingPage = ({ onStart, onAuth }: { onStart: () => void, onAuth: (view: 'login' | 'signup') => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: containerRef
  });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  const features = [
    {
      title: "Empathetic AI",
      description: "A companion that understands your body's unique rhythm and offers gentle support.",
      icon: Sparkles,
      color: "bg-lavender-100 text-lavender-600"
    },
    {
      title: "Personalized Care",
      description: "Daily nutrition and exercise plans tailored to your symptoms and energy levels.",
      icon: Calendar,
      color: "bg-rose-100 text-rose-500"
    },
    {
      title: "Deep Insights",
      description: "Identify patterns in your sleep, mood, and symptoms to take back control.",
      icon: BarChart2,
      color: "bg-sage-100 text-sage-600"
    }
  ];

  const benefits = [
    { text: "Hormone Tracking", icon: Sparkles },
    { text: "Sleep Optimization", icon: Moon },
    { text: "Mood Journaling", icon: Heart },
    { text: "Symptom Relief", icon: Zap }
  ];

  const steps = [
    {
      number: "01",
      title: "Log Daily",
      description: "Track symptoms, mood, and sleep in seconds.",
      icon: Activity
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "Our AI identifies patterns and triggers unique to you.",
      icon: Sparkles
    },
    {
      number: "03",
      title: "Get Support",
      description: "Receive personalized advice and care plans.",
      icon: Heart
    }
  ];

  const testimonials = [
    { name: "Sarah", text: "Finally, someone who understands what I'm going through.", role: "User for 3 months" },
    { name: "Elena", text: "The personalized care plan is a game changer.", role: "User for 6 months" }
  ];

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center overflow-hidden">
      <div className="w-full max-w-md bg-[#FDFCFB] min-h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Scroll Progress Bar */}
        <motion.div 
          style={{ scaleX }}
          className="absolute top-0 left-0 right-0 h-1 bg-lavender-400 origin-left z-[100]"
        />
        
        <div 
          ref={containerRef} 
          className="flex-1 overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth pb-48 relative"
        >
          {/* Background Orbs */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-10%] right-[-20%] w-96 h-96 bg-lavender-100/40 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-20%] w-96 h-96 bg-rose-100/30 rounded-full blur-[100px]" />
            <div className="absolute top-[40%] left-[-10%] w-64 h-64 bg-sage-100/20 rounded-full blur-[80px]" />
          </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col px-8 pt-20 pb-12 min-h-[80vh] snap-start">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-100 shadow-sm mb-8">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Science-Backed Care</span>
          </div>
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-lavender-200/40 mb-8 border border-white/60 relative">
            <Sparkles size={48} className="text-lavender-500" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-400 rounded-full border-4 border-white" />
          </div>
          <h1 className="serif text-6xl font-light text-slate-900 tracking-tight mb-3">PeriHer</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-lavender-400">Your AI Companion</p>
        </motion.div>

        <div className="flex-1 flex flex-col justify-center space-y-8 text-center">
          <h2 className="serif text-5xl font-medium text-slate-800 leading-[1.1]">
            Navigate change <br />
            <span className="italic text-lavender-600">with grace.</span>
          </h2>
          <p className="text-slate-500 font-light leading-relaxed max-w-[300px] mx-auto text-lg">
            Personalized support for your unique perimenopause journey.
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            {benefits.map((benefit, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/60"
              >
                <benefit.icon size={14} className="text-lavender-400" />
                <span className="text-[11px] font-medium text-slate-600">{benefit.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                  <img src={`https://picsum.photos/seed/woman${i}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Join 10,000+ women</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-slate-300"
          >
            <ChevronRight size={32} className="rotate-90" />
          </motion.div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Scroll to explore</p>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="relative z-10 px-8 py-16 flex flex-col justify-center snap-start bg-white/30 backdrop-blur-sm">
        <div className="mb-12 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-lavender-500 mb-3 block">The Experience</span>
          <h2 className="serif text-4xl font-medium text-slate-800 leading-tight">Simple. Powerful.</h2>
        </div>
        
        <div className="space-y-12 relative">
          {/* Connecting Line */}
          <div className="absolute left-[24px] top-8 bottom-8 w-px bg-lavender-100" />
          
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="flex gap-6 relative z-10"
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-lavender-100 flex items-center justify-center shadow-sm">
                  <step.icon size={18} className="text-lavender-500" />
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-lavender-300 uppercase tracking-widest">{step.number}</span>
                  <h3 className="text-lg font-semibold text-slate-800">{step.title}</h3>
                </div>
                <p className="text-slate-500 text-sm font-light leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stacked Insights with Parallax */}
      <div className="relative z-10 px-8 space-y-6 pb-24 snap-none">
        <div className="pt-16 mb-[-20px] text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sage-500 mb-3 block">Intelligence</span>
          <h2 className="serif text-4xl font-medium text-slate-800">Built for you</h2>
        </div>
        {features.map((feature, index) => (
          <ParallaxSection key={index} feature={feature} index={index} />
        ))}
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 px-8 py-16 flex flex-col justify-center snap-start">
        <div className="mb-10 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-emerald-500 mb-3 block">Community</span>
          <h2 className="serif text-4xl font-medium text-slate-800 leading-tight">Real stories.</h2>
        </div>
        
        <div className="space-y-4">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-[2rem] soft-shadow border border-slate-50"
            >
              <p className="serif text-lg italic text-slate-700 mb-4 font-light leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-lavender-600 font-bold text-xs">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative z-10 px-8 py-16 flex flex-col justify-center snap-start bg-slate-50/50">
        <div className="mb-10 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-lavender-500 mb-3 block">Support</span>
          <h2 className="serif text-4xl font-medium text-slate-800 leading-tight">Common Questions.</h2>
        </div>
        
        <div className="space-y-3">
          {[
            { q: "Is my data private?", a: "Yes, your data is encrypted and never shared with third parties." },
            { q: "How does the AI work?", a: "Our AI uses clinical research to identify patterns in your unique symptoms." },
            { q: "Can I use it with my doctor?", a: "Absolutely. You can export your data to share with your healthcare provider." }
          ].map((faq, i) => (
            <details key={i} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="text-xs font-semibold text-slate-800">{faq.q}</span>
                <ChevronRight size={16} className="text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-xs text-slate-500 font-light leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Final Footer CTA */}
      <div className="relative z-10 px-8 py-20 text-center snap-start">
        <h2 className="serif text-3xl font-medium text-slate-800 mb-4">Ready to feel <br />like yourself again?</h2>
        <p className="text-slate-500 text-sm font-light mb-8">Join thousands of women navigating perimenopause with confidence.</p>
        
        <div className="space-y-4 max-w-[280px] mx-auto">
          <button 
            onClick={() => onAuth('signup')}
            className="w-full py-5 bg-lavender-500 text-white rounded-[2rem] font-bold text-sm uppercase tracking-widest soft-shadow hover:bg-lavender-600 transition-all active:scale-95 pointer-events-auto"
          >
            Create My Plan
          </button>
          <button 
            onClick={() => onAuth('login')}
            className="w-full py-5 bg-white text-lavender-500 border border-lavender-100 rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:bg-lavender-50 transition-all active:scale-95 pointer-events-auto"
          >
            I Have an Account
          </button>
        </div>

        <div className="mt-12 w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart size={24} className="text-lavender-500 fill-lavender-500/20" />
        </div>
      </div>

      </div>

      {/* Fixed CTA */}
      <div className="absolute bottom-8 left-0 right-0 px-8 z-30 pointer-events-none">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 1, type: "spring" }}
          className="glass rounded-[2rem] p-2 soft-shadow border border-white/80 pointer-events-auto"
        >
          <button 
            onClick={onStart}
            className="w-full py-5 bg-lavender-500 text-white rounded-[1.8rem] font-medium text-lg shadow-xl shadow-lavender-200 hover:bg-lavender-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            See sample
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  </div>
  );
};

const ParallaxSection = ({ feature, index }: { feature: any, index: number }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Parallax effect: reduced intensity to keep cards closer
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 soft-shadow snap-center border border-white/60 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-lavender-100/20 to-transparent rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
      
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm", feature.color)}>
        {React.createElement(feature.icon, { size: 28 })}
      </div>
      <h3 className="serif text-3xl font-medium text-slate-800 mb-4">{feature.title}</h3>
      <p className="text-slate-500 text-base font-light leading-relaxed">
        {feature.description}
      </p>
      
      <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-lavender-400">
        <span>Learn more</span>
        <ChevronRight size={12} />
      </div>
    </motion.div>
  );
};

const HomeScreen = ({ userName, saveStatus, onSymptomSelect, onPlanItemClick, preferences, setPreferences, onLog, onLogout, customPlan }: { userName: string, saveStatus: string, onSymptomSelect: (s: Symptom) => void, onPlanItemClick: (item: any) => void, preferences: UserPreferences, setPreferences: (p: UserPreferences) => void, onLog: (log: Partial<DailyLog>) => void, onLogout: () => void, customPlan: any[] }) => {
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const mood = selectedSymptom === 'good' ? 'energetic' : selectedSymptom === 'anxious' ? 'stressed' : 'calm';

  const symptoms: { id: Symptom, label: string, icon: any }[] = [
    { id: 'tired', label: 'Tired', icon: Moon },
    { id: 'anxious', label: 'Anxious', icon: Wind },
    { id: 'brain fog', label: 'Brain Fog', icon: Sparkles },
    { id: 'good', label: 'Good', icon: Sun },
  ];

  const defaultPlan = [
    { type: 'exercise', title: '15-minute gentle stretch', description: 'A series of slow, rhythmic stretches to release tension in your hips and lower back. Perfect for starting your day with ease.', icon: Activity, color: 'bg-sage-50', text: 'text-sage-500' },
    { type: 'nutrition', title: 'Protein-rich breakfast', description: 'Greek yogurt topped with flaxseeds and walnuts. High in omega-3s to support brain health and steady energy levels.', icon: Coffee, color: 'bg-rose-50', text: 'text-rose-500' },
    { type: 'lifestyle', title: 'Short afternoon walk', description: 'A 10-minute walk in natural light. Helps regulate your circadian rhythm and boosts mood during the afternoon slump.', icon: Wind, color: 'bg-blue-50', text: 'text-blue-400' },
  ];

  const adaptedPlan = [
    { type: 'exercise', title: '10-minute restorative yoga', description: 'Focus on deep breathing and supported poses. Designed to calm the nervous system and reduce anxiety or fatigue.', icon: Activity, color: 'bg-sage-50', text: 'text-sage-500' },
    { type: 'nutrition', title: 'Magnesium-rich smoothie', description: 'Spinach, banana, and almond butter. Magnesium helps with muscle relaxation and better sleep quality.', icon: Coffee, color: 'bg-rose-50', text: 'text-rose-500' },
    { type: 'lifestyle', title: '20-minute guided meditation', description: 'A calming practice focused on body awareness. Helps manage stress and brain fog by grounding your attention.', icon: Wind, color: 'bg-blue-50', text: 'text-blue-400' },
  ];

  const currentPlan = customPlan;

  const handleLog = async (log: Partial<DailyLog>) => {
    setTrigger(prev => prev + 1);
    setIsAiLoading(true);
    onLog(log);
    
    try {
      const logType = log.exercise ? 'exercise' : 'nutrition';
      const logDetail = log.exercise 
        ? `${log.exercise[0].duration}min of ${log.exercise[0].type} at ${log.exercise[0].intensity} intensity`
        : `${log.nutrition?.[0].meal} (${log.nutrition?.[0].tags.join(', ')})`;
      
      const prompt = `The user just logged a ${logType}: ${logDetail}. They are currently feeling ${selectedSymptom || 'okay'}. 
      Give them a short, empathetic, and supportive response (max 2 sentences). 
      Suggest how this might help them or what they could do next for their perimenopause wellness.`;
      
      const response = await getPeriHerResponse(prompt, []);
      setAiFeedback(response);
    } catch (error) {
      setAiFeedback("That's wonderful progress! Keep listening to your body.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <header className="pt-12 px-8 flex justify-between items-center">
        <div className="animate-fade-in">
          <h2 className="serif text-4xl font-light text-slate-900 leading-tight">Good morning, <br /><span className="italic text-lavender-500">{userName}.</span></h2>
          <p className="text-slate-400 mt-2 font-light">Your journey is unique.</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar state={preferences.avatar} size="sm" mood={mood} trigger={trigger} />
          {saveStatus !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-[7px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full flex items-center gap-1",
                saveStatus === 'saving' && "bg-slate-100 text-slate-400",
                saveStatus === 'saved' && "bg-emerald-50 text-emerald-500",
                saveStatus === 'error' && "bg-rose-50 text-rose-500"
              )}
            >
              {saveStatus === 'saving' && <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" />}
              {saveStatus === 'saved' && <CheckCircle2 size={8} />}
              {saveStatus}
            </motion.div>
          )}
          <button 
            onClick={onLogout}
            className="relative z-[60] cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all py-2 px-4 bg-slate-100/80 rounded-xl shadow-sm active:scale-95 border border-slate-200/50"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="px-8 space-y-8">
        <DailyLogging onLog={handleLog} />

        <AnimatePresence mode="wait">
          {(selectedSymptom || aiFeedback) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass-noise p-6 rounded-[2.5rem] border-white/40">
                <div className="relative z-10">
                  <div className="absolute top-0 right-0 p-4">
                    <Sparkles size={16} className="text-lavender-300 animate-pulse" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-lavender-500 shrink-0 soft-shadow border border-white/20">
                      {isAiLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-lavender-500 border-t-transparent" /> : <Sparkles size={24} />}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700 leading-relaxed font-light italic">
                        {aiFeedback || (preferences.autoAdaptPlan 
                          ? `I've refined your plan to support you through this ${selectedSymptom}. Let's prioritize gentle movement.`
                          : `I see you're feeling ${selectedSymptom}. I have some suggestions to help you feel more balanced.`)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-8 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="serif text-xl font-medium text-slate-800">How are you feeling?</h3>
          <button 
            onClick={() => setPreferences({ ...preferences, autoAdaptPlan: !preferences.autoAdaptPlan })}
            className={cn(
              "p-2 rounded-xl border transition-all soft-shadow",
              preferences.autoAdaptPlan ? "bg-lavender-500 border-lavender-400 text-white" : "bg-white border-warm-200 text-slate-300"
            )}
          >
            <Settings size={16} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {symptoms.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                setSelectedSymptom(s.id);
                onSymptomSelect(s.id);
                setAiFeedback(null);
                setTrigger(prev => prev + 1);
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300",
                selectedSymptom === s.id 
                  ? "bg-lavender-500 border-lavender-400 text-white soft-shadow" 
                  : "bg-white border-warm-200 text-slate-400 hover:border-lavender-200"
              )}
            >
              <s.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-8 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="serif text-2xl font-medium text-slate-800">Today's Plan</h3>
          <span className="text-[10px] font-bold text-lavender-400 uppercase tracking-[0.2em]">{new Date().toLocaleString('default', { month: 'long' })} {new Date().getDate()}</span>
        </div>

        <div className="space-y-4">
          {currentPlan.map((item, idx) => (
            <motion.div 
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              onClick={() => onPlanItemClick(item)}
              className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 soft-shadow group hover:border-lavender-200 transition-all cursor-pointer active:scale-95"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.color, item.text)}>
                <item.icon size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">{item.type}</p>
                <h4 className="font-medium text-slate-700">{item.title}</h4>
              </div>
              <ChevronRight size={16} className="text-slate-200 group-hover:text-lavender-300 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};

const PlanAndInsightsScreen = ({ logs, customPlan, onSelectItem }: { logs: DailyLog[], customPlan: any[], onSelectItem: (item: any) => void }) => {
  const [view, setView] = useState<'plan' | 'insights'>('plan');
  const [planMode, setPlanMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getLogsForDay = (day: number) => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateToMatch = `${year}-${month}-${dayStr}`;
    return logs.filter(log => log.date === dateToMatch);
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentDayNum = new Date().getDate();
  const selectedDayLogs = getLogsForDay(selectedDate);

  return (
    <div className="space-y-8 pb-32 px-8 pt-12">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="serif text-4xl font-light text-slate-900">{view === 'plan' ? 'Your Plan' : 'Insights'}</h2>
          <p className="text-slate-400 mt-2 font-light">{view === 'plan' ? `Curated for ${currentMonth} ${currentDayNum}.` : 'Patterns in your wellness.'}</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-warm-200 soft-shadow">
          <button 
            onClick={() => setView('plan')}
            className={cn("p-2.5 rounded-xl transition-all", view === 'plan' ? "bg-lavender-500 text-white shadow-lg shadow-lavender-200" : "text-slate-300")}
          >
            <Calendar size={20} />
          </button>
          <button 
            onClick={() => setView('insights')}
            className={cn("p-2.5 rounded-xl transition-all", view === 'insights' ? "bg-lavender-500 text-white shadow-lg shadow-lavender-200" : "text-slate-300")}
          >
            <BarChart2 size={20} />
          </button>
        </div>
      </header>

      {view === 'plan' ? (
        <div className="space-y-8">
          <div className="flex bg-white p-1.5 rounded-2xl border border-warm-200 soft-shadow">
            <button 
              onClick={() => setPlanMode('list')}
              className={cn("flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest", planMode === 'list' ? "bg-lavender-50 text-lavender-600" : "text-slate-400")}
            >
              <ListIcon size={16} /> List
            </button>
            <button 
              onClick={() => setPlanMode('calendar')}
              className={cn("flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest", planMode === 'calendar' ? "bg-lavender-50 text-lavender-600" : "text-slate-400")}
            >
              <Layout size={16} /> Calendar
            </button>
          </div>

          {planMode === 'list' ? (
            <div className="space-y-10">
              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="serif text-2xl font-medium text-slate-800">Movement</h3>
                  <span className="text-[10px] font-bold text-sage-500 uppercase tracking-[0.2em]">Active</span>
                </div>
                <div className="space-y-4">
                  {WEEKLY_PLAN.filter(i => i.type === 'exercise').map(item => (
                    <Card 
                      key={item.id} 
                      className="p-5 rounded-3xl border-slate-100 soft-shadow cursor-pointer active:scale-[0.98] transition-transform group"
                      onClick={() => onSelectItem({ ...item, color: 'bg-sage-50', text: 'text-sage-500', icon: Dumbbell })}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sage-50 text-sage-500 flex items-center justify-center transition-colors">
                          <Dumbbell size={22} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-700">{item.title}</h4>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-200 flex items-center justify-center">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="serif text-2xl font-medium text-slate-800">Nourishment</h3>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em]">Balanced</span>
                </div>
                <div className="space-y-4">
                  {WEEKLY_PLAN.filter(i => i.type === 'nutrition').map(item => (
                    <Card 
                      key={item.id} 
                      className="p-5 rounded-3xl border-slate-100 soft-shadow cursor-pointer active:scale-[0.98] transition-transform group"
                      onClick={() => onSelectItem({ ...item, color: 'bg-rose-50', text: 'text-rose-500', icon: Apple })}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center transition-colors">
                          <Apple size={22} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-700">{item.title}</h4>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-200 flex items-center justify-center">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {days.map((d, i) => <span key={i} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 30 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === currentDayNum;
                  const hasPlan = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 30].includes(dayNum);
                  
                  return (
                    <motion.div 
                      key={i} 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedDate(dayNum)}
                      className={cn(
                        "aspect-square rounded-2xl flex flex-col items-center justify-center relative border transition-all duration-300 cursor-pointer",
                        selectedDate === dayNum ? "bg-slate-900 text-white border-slate-900 soft-shadow" : "bg-white border-warm-100 text-slate-500",
                        dayNum === currentDayNum && selectedDate !== currentDayNum && "border-lavender-400",
                        hasPlan && "hover:border-lavender-300"
                      )}
                    >
                      <span className="text-xs font-medium">{dayNum}</span>
                      {(hasPlan || getLogsForDay(dayNum).length > 0) && (
                        <div className={cn("w-1 h-1 rounded-full mt-1", selectedDate === dayNum ? "bg-lavender-400" : "bg-lavender-300")} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="space-y-6">
                {selectedDayLogs.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Your Activity</h4>
                    {selectedDayLogs.map((log, idx) => (
                      <Card key={idx} className="p-6 rounded-[2rem] soft-shadow border-warm-100 bg-white space-y-4">
                        {log.symptom && (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-lavender-50 text-lavender-500 flex items-center justify-center shrink-0">
                              <Sparkles size={20} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-800">Felt {log.symptom}</h5>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Daily Check-in</p>
                            </div>
                          </div>
                        )}
                        {log.exercise && log.exercise.map((ex: any, i: number) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-sage-50 text-sage-500 flex items-center justify-center shrink-0">
                              <Dumbbell size={20} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-800">{ex.type}</h5>
                              <p className="text-xs text-slate-400 mt-1">{ex.duration} min · {ex.intensity} intensity</p>
                            </div>
                          </div>
                        ))}
                        {log.nutrition && log.nutrition.map((nut: any, i: number) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                              <Utensils size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h5 className="font-semibold text-slate-800">{nut.meal}</h5>
                                {nut.weight && <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">{nut.weight}</span>}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {nut.tags && nut.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[9px] font-bold rounded-full uppercase">{tag}</span>
                                ))}
                              </div>
                              {nut.image && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-rose-100 aspect-video">
                                  <img src={nut.image} alt="Meal" className="w-full h-full object-cover" />
                                </div>
                              )}
                              {nut.aiAnalysis && (
                                <div className="mt-3 p-3 bg-lavender-50/50 rounded-xl border border-lavender-100">
                                  <p className="text-[10px] font-bold text-lavender-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Sparkles size={10} /> AI Insight
                                  </p>
                                  <p className="text-xs text-slate-600 italic font-light leading-relaxed">"{nut.aiAnalysis}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="mt-8 p-8 bg-lavender-50/50 border-lavender-100 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-lavender-500 soft-shadow">
                        <Sparkles size={20} />
                      </div>
                      <h4 className="serif text-xl font-medium text-slate-800">{selectedDate === currentDayNum ? "Today's Focus" : `Focus for ${currentMonth} ${selectedDate}`}</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-light italic">
                      {selectedDate === currentDayNum 
                        ? "Prioritizing bone health today with strength training. Your body will thank you for the extra support."
                        : "Focusing on restorative practices and mindful movement to maintain balance and energy levels."}
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {view === 'insights' && INSIGHTS.length > 0 ? (
            <div className="space-y-4">
              {INSIGHTS.map((insight, i) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={cn(
                    "p-6 rounded-[2rem] soft-shadow border-warm-100",
                    insight.type === 'positive' ? "bg-sage-50/30" : "bg-lavender-50/30"
                  )}>
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 soft-shadow",
                        insight.type === 'positive' ? "bg-white text-sage-500" : "bg-white text-lavender-500"
                      )}>
                        {insight.type === 'positive' ? <Sparkles size={20} /> : <Activity size={20} />}
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-light italic">
                        {insight.text}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : view === 'insights' ? (
            <Card className="p-8 bg-lavender-50/50 border-lavender-100 rounded-[2.5rem] flex flex-col items-center text-center">
              <Sparkles size={32} className="text-lavender-300 mb-4" />
              <h4 className="serif text-xl font-medium text-slate-800">Logging for Insights</h4>
              <p className="text-sm text-slate-400 mt-2 font-light italic">Keep logging your symptoms and activities. I'll start sharing personalized insights once I see your patterns.</p>
            </Card>
          ) : null}

          {view === 'insights' && CHART_DATA.length > 0 && (
            <Card className="p-8 rounded-[2.5rem] soft-shadow border-warm-100">
              <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-8">Wellness Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA}>
                    <defs>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1', fontWeight: 600}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '12px 20px' }}
                    />
                    <Area type="monotone" dataKey="sleep" stroke="#a78bfa" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={4} />
                    <Area type="monotone" dataKey="energy" stroke="#a3b1a3" fill="transparent" strokeWidth={2} strokeDasharray="8 8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lavender-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sleep</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Energy</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

const ProgressScreen = ({ logs, preferences, setPreferences, achievements, trigger, setTrigger }: { logs: DailyLog[], preferences: UserPreferences, setPreferences: (p: UserPreferences) => void, achievements: Achievement[], trigger: number, setTrigger: React.Dispatch<React.SetStateAction<number>> }) => {
  const [activeCategory, setActiveCategory] = useState<'achievements' | 'avatar' | 'rewards'>('achievements');

  const accessories = [
    { id: 'glasses', label: 'Glasses', icon: Smile },
    { id: 'hat', label: 'Hat', icon: Shirt },
    { id: 'scarf', label: 'Scarf', icon: Wind },
    { id: 'crown', label: 'Crown', icon: Gem },
  ];

  const handleToggleAccessory = (accId: string) => {
    const { avatar } = preferences;
    const isUnlocked = avatar.unlockedAccessories.includes(accId);
    if (!isUnlocked) return;

    setTrigger(prev => prev + 1);
    const isEquipped = avatar.accessories.includes(accId);
    const newAccessories = isEquipped 
      ? avatar.accessories.filter(a => a !== accId)
      : [...avatar.accessories, accId];
    
    setPreferences({
      ...preferences,
      avatar: { ...avatar, accessories: newAccessories }
    });
  };

  return (
    <div className="space-y-10 pb-32 px-8 pt-12">
      <header className="animate-fade-in flex justify-between items-start">
        <div>
          <h2 className="serif text-4xl font-light text-slate-900 leading-tight">Your <span className="italic text-lavender-500">Progress.</span></h2>
          <p className="text-slate-400 mt-2 font-light">Celebrating every small victory.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-warm-200 soft-shadow">
          {(['achievements', 'avatar', 'rewards'] as const).map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "p-2 rounded-xl transition-all",
                activeCategory === cat ? "bg-lavender-500 text-white" : "text-slate-300"
              )}
            >
              {cat === 'achievements' && <Award size={18} />}
              {cat === 'avatar' && <UserIcon size={18} />}
              {cat === 'rewards' && <ShoppingBag size={18} />}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeCategory === 'achievements' && (
          <motion.div 
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 rounded-[2rem] bg-lavender-50/50 border-lavender-100 flex flex-col items-center text-center soft-shadow">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-lavender-500 mb-4 soft-shadow">
                  <Award size={24} />
                </div>
                <p className="text-3xl font-light text-slate-900 serif">{achievements.filter(a => a.completed).length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unlocked</p>
              </Card>
              <Card className="p-6 rounded-[2rem] bg-sage-50/50 border-sage-100 flex flex-col items-center text-center soft-shadow">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-sage-500 mb-4 soft-shadow">
                  <Zap size={24} />
                </div>
                <p className="text-3xl font-light text-slate-900 serif">{logs.length > 0 ? 1 : 0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Day Streak</p>
              </Card>
            </div>

            <section className="space-y-6">
              <h3 className="serif text-2xl font-medium text-slate-800 px-2">Milestones</h3>
              <div className="space-y-4">
                {achievements.map((achievement, i) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-5 p-5 bg-white rounded-[2rem] border border-warm-200 soft-shadow"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                      achievement.completed ? "bg-lavender-100 text-lavender-500" : "bg-warm-50 text-slate-300"
                    )}>
                      <Award size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{achievement.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-light">{achievement.description}</p>
                      <div className="mt-3 h-1.5 w-full bg-warm-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                          className={cn("h-full rounded-full", achievement.completed ? "bg-lavender-400" : "bg-slate-200")}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeCategory === 'avatar' && (
          <motion.div 
            key="avatar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="flex flex-col items-center justify-center py-8">
              <Avatar state={preferences.avatar} size="lg" trigger={trigger} />
              <div className="mt-6 text-center">
                <h3 className="serif text-2xl font-medium text-slate-800">Your Companion</h3>
                <p className="text-slate-400 text-sm font-light mt-1">Unlock more by staying consistent.</p>
              </div>
            </div>

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Accessories</h4>
              <div className="grid grid-cols-2 gap-4">
                {accessories.map((acc) => {
                  const isUnlocked = preferences.avatar.unlockedAccessories.includes(acc.id);
                  const isEquipped = preferences.avatar.accessories.includes(acc.id);
                  
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleToggleAccessory(acc.id)}
                      disabled={!isUnlocked}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-3xl border transition-all relative overflow-hidden",
                        isUnlocked 
                          ? isEquipped 
                            ? "bg-lavender-500 border-lavender-400 text-white soft-shadow" 
                            : "bg-white border-warm-200 text-slate-600 hover:border-lavender-200"
                          : "bg-warm-50 border-warm-100 text-slate-300 cursor-not-allowed"
                      )}
                    >
                      <acc.icon size={20} />
                      <span className="text-xs font-bold uppercase tracking-widest">{acc.label}</span>
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-warm-50/60 flex items-center justify-center">
                          <Lock size={16} className="text-slate-300" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}

        {activeCategory === 'rewards' && (
          <motion.div 
            key="rewards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <Card className="p-8 rounded-[3rem] bg-gradient-to-br from-lavender-500 to-lavender-600 text-white soft-shadow overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Next Reward</p>
                    <h3 className="serif text-2xl font-medium mt-1">Free Yoga Class</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <ShoppingBag size={24} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Progress</span>
                    <span>{logs.length > 0 ? 1 : 0} / 7 days</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: logs.length > 0 ? `${(1/7)*100}%` : '0%' }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <section className="space-y-6">
              <h3 className="serif text-2xl font-medium text-slate-800 px-2">Available Rewards</h3>
              <div className="space-y-4">
                {[
                  { title: 'Wellness Goodie Bag', type: 'Real-world', progress: 0, target: 30, icon: ShoppingBag, color: 'bg-rose-50 text-rose-500' },
                  { title: 'Golden Crown Accessory', type: 'Virtual', progress: 0, target: 7, icon: Gem, color: 'bg-yellow-50 text-yellow-500' },
                  { title: '1-Month Premium Subscription', type: 'Real-world', progress: 0, target: 90, icon: Zap, color: 'bg-blue-50 text-blue-500' },
                ].map((reward, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2.5rem] soft-shadow border border-warm-100 flex items-center gap-5">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", reward.color)}>
                      <reward.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-slate-800">{reward.title}</h4>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">{reward.type}</span>
                      </div>
                      <div className="mt-3 h-1.5 w-full bg-warm-50 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${(reward.progress / reward.target) * 100}%` }}
                          className="h-full bg-slate-200 rounded-full"
                        />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{reward.progress} / {reward.target} points</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AskPeriHerScreen = ({ userName }: { userName: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { id: '1', role: 'assistant', content: `Hello ${userName}. I'm here to support you. Is there anything on your mind today?`, timestamp: new Date() }
    ]);
  }, [userName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await getPeriHerResponse(input, history);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "I'm sorry, I'm having a little trouble connecting right now. Let's try again in a moment.", timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen pt-12">
      <header className="px-8 pb-6 border-b border-warm-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-lavender-500 flex items-center justify-center text-white soft-shadow">
          <div className="animate-pulse">
            <Sparkles size={24} />
          </div>
        </div>
        <div>
          <h2 className="serif text-2xl font-medium text-slate-900">Ask PeriHer</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Always here for you</span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === 'user' ? "ml-auto items-end" : "items-start"
            )}
          >
            <div className={cn(
              "p-5 rounded-[2rem] text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-slate-900 text-white rounded-tr-none soft-shadow" 
                : "glass text-slate-700 rounded-tl-none soft-shadow"
            )}>
              <Markdown>{msg.content}</Markdown>
            </div>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2 px-2">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-300 px-4">
            <div className="w-1.5 h-1.5 rounded-full bg-lavender-300 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-lavender-300 animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-lavender-300 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      <div className="p-8 pb-32">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="How can I help you today?"
            className="w-full bg-white border border-warm-200 rounded-[2rem] py-5 pl-8 pr-16 text-sm focus:outline-none focus:border-lavender-300 transition-all soft-shadow"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 w-12 h-12 bg-lavender-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-lavender-200 active:scale-90 transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Auth Screen ---

const AuthScreen = ({ initialView, onClose }: { initialView: 'login' | 'signup', onClose: () => void }) => {
  const [view, setView] = useState<'login' | 'signup'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Attempting ${view}...`, { email });
      if (view === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
        console.log('Login successful');
      } else {
        console.log('Calling supabase.auth.signUp...');
        
        // Add a safety timeout to avoid "forever processing" if the promise never resolves
        const signUpPromise = supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || 'Guest',
            }
          }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign up timed out. Please check your connection or try again.')), 15000)
        );

        const { data: signUpData, error: signUpError } = await Promise.race([signUpPromise, timeoutPromise]) as any;
        
        if (signUpError) {
          console.error('Sign up error object:', signUpError);
          throw signUpError;
        }
        
        console.log('Sign up successful:', signUpData);
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.error('Auth Exception:', err);
      if (err.message?.toLowerCase().includes('rate flag') || err.message?.toLowerCase().includes('rate limit')) {
        setError("Rate limit exceeded. Please wait a moment or check your email settings in Supabase.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      console.log('Auth process finished, resetting loading state');
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-emerald-50 rounded-full blur-2xl" />
          
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            
            <h2 className="serif text-3xl font-medium text-slate-800 mb-4">Check your email</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              We've sent a magic link to <span className="font-bold text-slate-900">{email}</span>. 
              Please click it to confirm your account and start your journey.
            </p>
            
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Background Sparkles */}
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-lavender-100/50 rounded-full blur-2xl" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
        >
          <Plus className="rotate-45" size={24} />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="w-16 h-16 bg-lavender-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-lavender-200">
            <Lock size={28} />
          </div>
          <h2 className="serif text-3xl font-medium text-slate-800">
            {view === 'login' ? 'Welcome Back' : 'Join PeriHer'}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {view === 'login' ? 'Sign in to your account' : 'Start your personalized journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">What should we call you?</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-lavender-300 focus:bg-white transition-all"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="hello@example.com"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-lavender-300 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-lavender-300 focus:bg-white transition-all"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-[11px] text-rose-500 font-medium px-1"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Processing...' : view === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setView(view === 'login' ? 'signup' : 'login')}
              className="text-lavender-600 font-bold hover:underline"
            >
              {view === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Onboarding Wizard ---

const OnboardingWizard = ({ onComplete }: { onComplete: (data: any) => void }) => {
  const [step, setStep] = useState(1);
  const [feelings, setFeelings] = useState({
    sleep: 3,
    energy: 3,
    stress: 3,
    mood: 3
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [timeAvailable, setTimeAvailable] = useState<number>(20);

  const symptoms = [
    'Brain fog', 'Anxiety', 'Night sweats', 
    'Weight change', 'Dryness', 'Irregular cycles', 'Hot Flash'
  ];

  const goals = [
    'More energy', 'Feel stronger', 'Better sleep', 
    'Reduce stress', 'Body composition'
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete({ feelings, selectedSymptoms, selectedGoals, timeAvailable });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-10">
            <h2 className="serif text-3xl text-slate-900 mb-8 leading-tight">How are you feeling lately?</h2>
            
            {[
              { key: 'sleep', label: 'SLEEP', low: 'DEPRIVED', high: 'WELL-RESTED' },
              { key: 'energy', label: 'ENERGY', low: 'LOW', high: 'HIGH' },
              { key: 'stress', label: 'STRESS', low: 'CALM', high: 'HIGH STRESS' },
              { key: 'mood', label: 'MOOD', low: 'LOW', high: 'GREAT' },
            ].map(({ key, label, low, high }) => (
              <div key={key} className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</label>
                  <span className="text-lavender-600 font-mono text-sm">{(feelings as any)[key]}/5</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={(feelings as any)[key]}
                  onChange={(e) => setFeelings(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lavender-600"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400 tracking-tight">
                  <span>{low}</span>
                  <span>{high}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <h2 className="serif text-3xl text-slate-900 mb-2 leading-tight">Any symptoms?</h2>
            <p className="text-slate-500 text-sm font-medium mb-10">Select all that apply to you lately.</p>
            
            <div className="flex flex-wrap gap-2.5">
              {symptoms.map(symptom => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    onClick={() => {
                      setSelectedSymptoms(prev => 
                        isSelected ? prev.filter(s => s !== symptom) : [...prev, symptom]
                      );
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-medium transition-all border",
                      isSelected 
                        ? "bg-lavender-600 border-lavender-600 text-white shadow-md shadow-lavender-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-lavender-300"
                    )}
                  >
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <h2 className="serif text-3xl text-slate-900 mb-8 leading-tight">What are your goals?</h2>
            
            <div className="flex flex-wrap gap-2.5 mb-12">
              {goals.map(goal => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => {
                      setSelectedGoals(prev => 
                        isSelected ? prev.filter(g => g !== goal) : [...prev, goal]
                      );
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-medium transition-all border",
                      isSelected 
                        ? "bg-lavender-600 border-lavender-600 text-white shadow-md shadow-lavender-200" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-lavender-300 transition-all shadow-sm"
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TIME AVAILABLE PER DAY</label>
              <div className="grid grid-cols-3 gap-4">
                {[10, 20, 30].map(time => (
                  <button
                    key={time}
                    onClick={() => setTimeAvailable(time)}
                    className={cn(
                      "py-5 rounded-xl flex flex-col items-center justify-center transition-all border",
                      timeAvailable === time
                        ? "bg-lavender-100 border-lavender-500 text-lavender-700 shadow-md ring-1 ring-lavender-500/20"
                        : "bg-white border-slate-200 text-slate-400"
                    )}
                  >
                    <span className="text-lg font-bold mb-0.5">{time}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest">MIN</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-lavender-25 overflow-y-auto flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-lavender-100 via-transparent to-transparent">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] flex flex-col font-sans shadow-2xl shadow-lavender-200/50 border border-warm-100/50 overflow-hidden">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-lavender-50">
          <button 
            onClick={() => step > 1 && setStep(step - 1)}
            className={cn("p-2 text-slate-300 hover:text-slate-600 transition-colors", step === 1 && "opacity-0 pointer-events-none")}
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  s === step ? "w-6 bg-lavender-500" : "w-1.5 bg-lavender-100"
                )}
              />
            ))}
          </div>
          
          <div className="w-8" />
        </div>

        <div className="flex-1 px-8 py-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 bg-warm-25/30 border-t border-lavender-50">
          <button
            onClick={handleNext}
            className="w-full py-4 bg-lavender-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-lavender-200/50 active:scale-95 transition-all"
          >
            {step === 3 ? 'Start your journey' : 'Continue'}
          </button>
          <p className="text-center text-[8px] text-slate-400 mt-6 tracking-[0.2em] font-bold uppercase">
            NOT MEDICAL ADVICE. CONSULT YOUR PHYSICIAN.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  // 1. All useState hooks
  const [session, setSession] = useState<Session | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'progress' | 'ask'>('home');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [trigger, setTrigger] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [selectedPlanItem, setSelectedPlanItem] = useState<any | null>(null);

  // Derived state: calculate current symptoms including today's log
  const todayStr = new Date().toISOString().split('T')[0];
  const latestLogForToday = logs.find(l => l.date === todayStr);
  const latestSymptom = latestLogForToday?.symptom;
  const symptomsList = onboardingData?.selectedSymptoms || [];
  const currentSymptoms = latestSymptom 
    ? [...new Set([...symptomsList, latestSymptom])] 
    : symptomsList;

  const [preferences, setPreferences] = useState<UserPreferences>({
    autoAdaptPlan: true,
    notificationsEnabled: true,
    avatar: {
      base: 'default',
      accessories: ['glasses'],
      unlockedAccessories: ['glasses', 'hat', 'scarf']
    }
  });

  // 2. All useEffect hooks
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        setIsStarted(true);
        setAuthView(null);
        
        const savedData = localStorage.getItem(`onboarding_data_${session.user.id}`);
        if (savedData) {
          setOnboardingData(JSON.parse(savedData));
        }

        if (event === 'SIGNED_IN') {
          const onboardedKey = `onboarded_${session.user.id}`;
          const hasOnboarded = localStorage.getItem(onboardedKey);
          
          if (!hasOnboarded) {
            const existingLogs = await fetchHistoricalLogs(session.user.id);
            if (existingLogs.length === 0) {
              setShowOnboarding(true);
            }
          }
        } else {
          fetchHistoricalLogs(session.user.id);
        }
      } else {
        setIsStarted(false);
        setShowOnboarding(false);
        setActiveTab('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Helper functions
  const fetchHistoricalLogs = async (userId: string): Promise<DailyLog[]> => {
    try {
      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false });

      if (error) throw error;

      const mappedLogs: DailyLog[] = (data || []).map((item: any) => {
        let exercise = undefined;
        if (item.activity_log) {
          try {
            const parsed = JSON.parse(item.activity_log);
            exercise = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            exercise = [{ type: item.activity_log, duration: 20, intensity: 'medium' }];
          }
        }

        let nutrition = undefined;
        if (item.diet_log) {
          try {
            const parsed = JSON.parse(item.diet_log);
            nutrition = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            nutrition = [{ meal: item.diet_log, tags: [] }];
          }
        }

        return {
          id: item.id || item.created_at,
          date: item.log_date,
          timestamp: new Date(item.log_date).getTime(),
          symptom: typeof item.symptom === 'object' ? item.symptom?.type : item.symptom,
          mood: item.mood_score?.toString(),
          exercise,
          nutrition,
        };
      });
      setLogs(mappedLogs);
      return mappedLogs;
    } catch (err) {
      console.error('Error fetching logs:', err);
      return [];
    }
  };

  const handleLog = async (logData: Partial<DailyLog>) => {
    setSaveStatus('saving');
    
    // Normalize log data
    const log: any = { ...logData };
    if ((logData as any).type === 'exercise' && (logData as any).detail) {
      log.exercise = [{ type: (logData as any).detail, duration: 20, intensity: 'medium' }];
    } else if ((logData as any).type === 'nutrition' && (logData as any).detail) {
      log.nutrition = [{ meal: (logData as any).detail, tags: ['Planned'] }];
    } else {
      if (logData.exercise && !Array.isArray(logData.exercise)) {
        log.exercise = [logData.exercise];
      }
      if (logData.nutrition && !Array.isArray(logData.nutrition)) {
        log.nutrition = [logData.nutrition];
      }
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Optimistic update
    setLogs(prev => {
      const existingTodayIndex = prev.findIndex(l => l.date === today);
      if (existingTodayIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingTodayIndex];
        
        const merged: DailyLog = { ...existing };
        if (log.exercise) {
          merged.exercise = [...(existing.exercise || []), ...log.exercise];
        }
        if (log.nutrition) {
          merged.nutrition = [...(existing.nutrition || []), ...log.nutrition];
        }
        if (log.symptom) merged.symptom = log.symptom;
        if (log.mood) merged.mood = log.mood;
        
        updated[existingTodayIndex] = merged;
        return updated;
      }
      
      const newLog: DailyLog = {
        id: Date.now().toString(),
        date: today,
        timestamp: Date.now(),
        ...log
      };
      return [newLog, ...prev];
    });

    setTrigger(prev => prev + 1);
    
    // Save to Supabase if session exists
    if (session?.user) {
      try {
        // 1. Fetch today's existing log to merge
        const { data: existingData } = await supabase
          .from('symptom_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('log_date', today)
          .maybeSingle();

        // 2. Prepare the payload (merging with existing if found)
        const dbLog: any = {
          user_id: session.user.id,
          log_date: today,
          symptom: log.symptom ? { type: log.symptom } : (existingData?.symptom || {}), 
          severity: existingData?.severity || 1, 
          mood_score: log.mood ? parseInt(log.mood) : (existingData?.mood_score || 5),
          energy_score: (log as any).energy ? parseInt((log as any).energy) : (existingData?.energy_score || 5),
          created_at: existingData?.created_at || new Date().toISOString(),
        };

        // Merge activity_log
        let currentExercises: any[] = [];
        const latestLocalLog = logs.find(l => l.date === today);
        
        if (existingData?.activity_log) {
          try {
            const parsed = JSON.parse(existingData.activity_log);
            currentExercises = Array.isArray(parsed) ? parsed : [parsed];
          } catch(e) { }
        } else if (latestLocalLog?.exercise) {
          currentExercises = latestLocalLog.exercise;
        }

        if (log.exercise) {
          // De-duplicate if needed (same type logged twice) - optional, for now just append
          dbLog.activity_log = JSON.stringify([...currentExercises, ...log.exercise]);
        } else {
          dbLog.activity_log = existingData?.activity_log || (latestLocalLog?.exercise ? JSON.stringify(latestLocalLog.exercise) : null);
        }

        // Merge diet_log
        let currentMeals: any[] = [];
        if (existingData?.diet_log) {
          try {
            const parsed = JSON.parse(existingData.diet_log);
            currentMeals = Array.isArray(parsed) ? parsed : [parsed];
          } catch(e) { }
        } else if (latestLocalLog?.nutrition) {
          currentMeals = latestLocalLog.nutrition;
        }

        if (log.nutrition) {
          dbLog.diet_log = JSON.stringify([...currentMeals, ...log.nutrition]);
        } else {
          dbLog.diet_log = existingData?.diet_log || (latestLocalLog?.nutrition ? JSON.stringify(latestLocalLog.nutrition) : null);
        }

        // 3. Upsert into Supabase
        const response = await supabase
          .from('symptom_logs')
          .upsert(dbLog, { onConflict: 'user_id,log_date' });
        
        if (response.error) throw response.error;
        
        // Re-fetch to ensure sync after save
        await fetchHistoricalLogs(session.user.id);
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        console.error('Detailed Save Error:', err);
        setSaveStatus('error');
      }
    } else {
      setSaveStatus('idle');
    }

    // Simple achievement progress logic
    setAchievements(prev => prev.map(a => {
      if (a.id === '1' && log.exercise) {
        const newProgress = Math.min(a.target, a.progress + 1);
        return { ...a, progress: newProgress, completed: newProgress >= a.target };
      }
      return a;
    }));
  };

  if (!isStarted) {
    return (
      <>
        <LandingPage 
          onStart={() => setIsStarted(true)} 
          onAuth={(view) => setAuthView(view)} 
        />
        {authView && <AuthScreen initialView={authView} onClose={() => setAuthView(null)} />}
      </>
    );
  }

  const handleLogout = async () => {
    try {
      // Clear wizard status for this specific user if needed
      if (session?.user) {
        localStorage.removeItem(`onboarded_${session.user.id}`);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      // Clear all local states to ensure a clean slate
      setSession(null);
      setIsStarted(false);
      setShowOnboarding(false);
      setActiveTab('home');
      setLogs([]);
      setOnboardingData(null);
      setAuthView(null);
    }
  };

  const handleOnboardingComplete = (data: any) => {
    setOnboardingData(data);
    if (session?.user) {
      localStorage.setItem(`onboarded_${session.user.id}`, 'true');
      localStorage.setItem(`onboarding_data_${session.user.id}`, JSON.stringify(data));
    }
    setShowOnboarding(false);
  };

  const capitalize = (str: string) => {
    if (!str) return '';
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getDynamicPlan = () => {
    const time = onboardingData?.timeAvailable || 20;
    const goals = onboardingData?.selectedGoals || [];
    
    const hasSymptom = (search: string) => {
      const lowerSearch = search.toLowerCase();
      return currentSymptoms.some((s: any) => s?.toString().toLowerCase().includes(lowerSearch));
    };

    const isTired = hasSymptom('tired') || hasSymptom('fatigue') || hasSymptom('energy');
    const isAnxious = hasSymptom('anxious') || hasSymptom('stress') || hasSymptom('mood');
    const isBrainFog = hasSymptom('brain fog') || hasSymptom('focus');
    const isInsomnia = hasSymptom('insomnia') || hasSymptom('sleep');

    return [
      {
        id: '1',
        type: 'exercise',
        title: isTired ? 'Restorative Flow' : (goals.includes('Feel stronger') ? 'Resistance Protocol' : 'Dynamic Flow'),
        description: isTired 
          ? 'Gentle, supportive movements to restore energy and reduce physical tension without exhaustion.' 
          : (goals.includes('Feel stronger') ? 'Targeted strength training to boost metabolism and maintain bone density.' : 'Fluid movements to improve mobility and reduce cortisol levels.'),
        icon: isTired ? Wind : Dumbbell,
        color: isTired ? 'bg-blue-50' : 'bg-sage-50',
        text: isTired ? 'text-blue-500' : 'text-sage-500',
        duration: `${time} MIN`,
        intensity: isTired || isInsomnia ? 'Low' : 'Moderate',
        focus: isAnxious ? 'Nervous System' : 'Core & Strength',
        workoutSteps: isTired
          ? [
              'Supported Child\'s Pose: 3 mins to ground the nervous system.',
              'Supine Twist: 2 mins each side to release spinal tension.',
              'Legs up the Wall: 5 mins for lymphatic drainage and rest.',
              'Gentle Hip Circles: 2 mins to move energy.',
              'Box Breathing: 3 mins to reset cortisol.'
            ]
          : (goals.includes('Feel stronger') 
            ? [
                'Bodyweight Squats: 3 sets of 12 reps.',
                'Incline Push-ups: 3 sets of 10 reps.',
                'Glute Bridges: 3 sets of 15 reps.',
                'Plank: 45 seconds.',
                'Cool down: 5 mins of static stretching.'
              ]
            : [
                'Cat-Cow Stretch: 10 slow rounds.',
                'Downward Facing Dog: 5 deep breaths.',
                'Sun Salutations: 4 meditative rounds.',
                'Child\'s Pose: 2 mins focus on breathing.',
                'Savasana: 5 mins total stillness.'
              ]),
        tutorialLink: 'https://www.youtube.com/results?search_query=perimenopause+yoga'
      },
      {
        id: '2',
        type: 'mindfulness',
        title: isBrainFog ? 'Cognitive Reset' : (isAnxious ? 'Calming Ground' : 'Mindful Breathing'),
        description: 'Guided practice to ground your attention, reduce mental clutter, and balance the nervous system.',
        icon: Wind,
        color: 'bg-blue-50',
        text: 'text-blue-500',
        duration: '10 MIN',
        workoutSteps: isAnxious 
          ? [
              'Find a quiet space and sit upright.',
              'Place one hand on your heart and one on your belly.',
              '4-7-8 Breathing: Inhale 4, hold 7, exhale 8 (5 rounds).',
              'Focus on the physical sensation of the breath.',
              'Scan your body for tension and exhale it out.'
            ]
          : [
              'Sit comfortably with a tall spine.',
              'Close your eyes or soften your gaze.',
              'Inhale for 4, hold for 4, exhale for 6.',
              'Notice any tension in your jaw and release it.',
              'Gentle neck rolls to finish.'
            ],
        tutorialLink: 'https://www.youtube.com/results?search_query=perimenopause+meditation'
      },
      {
        id: '3',
        type: 'nutrition',
        title: goals.includes('Better sleep') || isInsomnia ? 'Magnesium Dinner' : 'Anti-Inflammatory Bowl',
        description: 'Nutrient-dense meal designed to support hormonal balance and stable blood sugar.',
        icon: Apple,
        color: 'bg-rose-50',
        text: 'text-rose-500',
        duration: '25 MIN',
        ingredients: goals.includes('Better sleep') || isInsomnia
          ? ['200g Wild Salmon fillet', '2 cups baby spinach or kale', '1/2 cup roasted pumpkin seeds', '1/2 ripe avocado', 'Dressing: Lemon juice, olive oil, sea salt']
          : ['150g Grilled Tofu or Chicken breast', '1 cup cooked quinoa', '2 cups steamed broccoli florets', '2 tbsp Kimchi', 'Turmeric-Tahini dressing'],
        recipeSteps: goals.includes('Better sleep') || isInsomnia
          ? [
              'Season salmon with salt and lemon. Pan-sear for 4 mins per side.',
              'Lightly steam the leafy greens for 2 mins until wilted.',
              'Toast pumpkin seeds in a dry pan for 2 mins until fragrant.',
              'Slice the avocado and assemble ingredients in a large bowl.'
            ]
          : [
              'Cook quinoa according to package instructions.',
              'Steam broccoli for 4-5 mins until tender-crisp.',
              'Grill protein of choice with minimal oil.',
              'Assemble bowl with quinoa, broccoli, protein, and kimchi.',
              'Whisk tahini, turmeric, and lemon for the dressing.'
            ]
      }
    ];
  };

  const rawName = session?.user?.user_metadata?.display_name || 'Friend';
  const userName = capitalize(rawName);

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-warm-50 relative overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] left-[-10%] w-64 h-64 bg-lavender-100/40 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-rose-100/30 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            {activeTab === 'home' && (
              <HomeScreen 
                userName={userName}
                saveStatus={saveStatus}
                onSymptomSelect={(s) => {
                  setHasCheckedIn(true);
                  handleLog({ symptom: s });
                }} 
                onPlanItemClick={(item) => setSelectedPlanItem(item)}
                preferences={preferences}
                setPreferences={setPreferences}
                onLog={handleLog}
                onLogout={handleLogout}
                customPlan={getDynamicPlan()}
              />
            )}
            {activeTab === 'plan' && <PlanAndInsightsScreen logs={logs} customPlan={getDynamicPlan()} onSelectItem={setSelectedPlanItem} />}
            {activeTab === 'ask' && <AskPeriHerScreen userName={userName} />}
            {activeTab === 'progress' && (
              <ProgressScreen 
                logs={logs}
                preferences={preferences} 
                setPreferences={setPreferences}
                achievements={achievements}
                trigger={trigger}
                setTrigger={setTrigger}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] glass rounded-[2.5rem] p-3 flex justify-between items-center z-50 soft-shadow border border-white/50">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={Home} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'plan'} 
          onClick={() => setActiveTab('plan')} 
          icon={Calendar} 
          label="Plan" 
        />
        <NavButton 
          active={activeTab === 'progress'} 
          onClick={() => setActiveTab('progress')} 
          icon={Award} 
          label="Stats" 
        />
        <NavButton 
          active={activeTab === 'ask'} 
          onClick={() => setActiveTab('ask')} 
          icon={Sparkles} 
          label="Ask" 
          isSpecial
        />
      </nav>

      <AnimatePresence>
        {selectedPlanItem && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlanItem(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <div className="relative w-full max-w-lg bg-warm-50 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-white/20">
              {/* Header with Close Button */}
              <div className="sticky top-0 z-20 bg-warm-50/90 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-warm-100 shrink-0">
                <button 
                  id="close-plan-detail"
                  onClick={() => setSelectedPlanItem(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-lavender-500 hover:bg-lavender-50 transition-all soft-shadow"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-lavender-400">Personalized Plan</p>
                  <h3 className="serif text-xl font-medium text-slate-800">Activity Insight</h3>
                </div>
                <div className="w-10" />
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 pb-24">
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-warm-100 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-warm-50/50 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-8">
                      <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg", selectedPlanItem.color, selectedPlanItem.text)}>
                        <selectedPlanItem.icon size={32} />
                      </div>
                      <div>
                        <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1", selectedPlanItem.text)}>{selectedPlanItem.type}</p>
                        <h4 className="serif text-3xl font-medium text-slate-800">{selectedPlanItem.title}</h4>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mb-8">
                      <div className="px-4 py-2 bg-warm-50 rounded-full border border-warm-100 flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{selectedPlanItem.duration}</span>
                      </div>
                      {selectedPlanItem.intensity && (
                        <div className="px-4 py-2 bg-warm-50 rounded-full border border-warm-100 flex items-center gap-2">
                          <Activity size={14} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{selectedPlanItem.intensity} INTENSITY</span>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-500 leading-relaxed font-light mb-8 text-sm">
                      {selectedPlanItem.description}
                    </p>
                    
                    <div className="p-6 bg-lavender-50/30 rounded-[2rem] border border-lavender-100/50 mb-10">
                      <h5 className="text-[10px] font-bold text-lavender-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles size={14} /> AI Optimization
                      </h5>
                      <p className="text-xs text-slate-600 font-light leading-relaxed">
                        This activity was dynamically adjusted based on your reported <strong>{currentSymptoms.join(', ')}</strong> symptoms. We've prioritized {selectedPlanItem.focus || 'balance'} to support your cortisol levels.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {selectedPlanItem.workoutSteps && (
                        <div className="space-y-5">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                             Guiding Steps
                          </h5>
                          <div className="space-y-4">
                            {selectedPlanItem.workoutSteps.map((step: string, i: number) => (
                              <div key={i} className="flex gap-4 group">
                                <span className={cn("w-6 h-6 rounded-full text-[10px] flex items-center justify-center shrink-0 font-bold transition-colors", selectedPlanItem.color, selectedPlanItem.text)}>{i+1}</span>
                                <p className="text-sm text-slate-600 leading-relaxed font-light group-hover:text-slate-900 transition-colors">{step}</p>
                              </div>
                            ))}
                          </div>
                          {selectedPlanItem.tutorialLink && (
                            <a href={selectedPlanItem.tutorialLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-lavender-600 mt-4 hover:bg-lavender-50 px-4 py-2 rounded-full transition-colors">
                              <Sparkles size={14} /> See Video Tutorial
                            </a>
                          )}
                        </div>
                      )}

                      {selectedPlanItem.ingredients && (
                        <div className="space-y-6">
                           <div>
                            <h5 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Utensils size={14} /> Ingredients
                            </h5>
                            <ul className="grid grid-cols-1 gap-2">
                              {selectedPlanItem.ingredients.map((ing: string, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-slate-600 font-light">
                                  <div className="w-1 h-1 rounded-full bg-rose-200" />
                                  {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3">Preparation</h5>
                            <div className="space-y-4">
                              {selectedPlanItem.recipeSteps.map((step: string, i: number) => (
                                <div key={i} className="flex gap-4">
                                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-[10px] flex items-center justify-center shrink-0 font-bold">{i+1}</span>
                                  <p className="text-sm text-slate-600 leading-relaxed font-light">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      id="log-plan-action"
                      onClick={() => {
                        handleLog({ 
                          type: selectedPlanItem.type === 'nutrition' ? 'nutrition' : 'exercise',
                          detail: selectedPlanItem.title 
                        } as any);
                        setSelectedPlanItem(null);
                      }}
                      className="w-full mt-10 bg-lavender-600 text-white py-5 rounded-3xl font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-lavender-200 hover:bg-lavender-700 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Plus size={20} /> Log this {selectedPlanItem.type === 'nutrition' ? 'Meal' : 'Activity'}
                    </button>
                  </div>
                </section>

                <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="serif text-2xl font-medium text-slate-800">Other Recommendations</h3>
                    <span className="text-[10px] font-bold text-lavender-400 uppercase tracking-[0.2em]">Full List</span>
                  </div>
                  
                  <div className="space-y-4">
                    {WEEKLY_PLAN.filter(i => i.id !== selectedPlanItem.id).slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-warm-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-warm-50 flex items-center justify-center text-slate-400">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">{item.type}</p>
                          <p className="font-medium text-slate-700">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedPlanItem(null);
                    setActiveTab('plan');
                  }}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-medium soft-shadow hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  View My Full Calendar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavButton = ({ active, onClick, icon: Icon, label, isSpecial }: { active: boolean, onClick: () => void, icon: any, label: string, isSpecial?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center justify-center transition-all duration-500",
      isSpecial ? "w-14 h-14" : "w-12 h-12"
    )}
  >
    {isSpecial ? (
      <div className={cn(
        "w-full h-full rounded-2xl flex items-center justify-center transition-all duration-500",
        active ? "bg-slate-900 text-white shadow-xl scale-110" : "bg-lavender-100 text-lavender-500"
      )}>
        <Icon size={24} />
      </div>
    ) : (
      <>
        <Icon 
          size={24} 
          className={cn(
            "transition-all duration-500",
            active ? "text-slate-900 scale-110" : "text-slate-300"
          )} 
        />
        {active && (
          <motion.div 
            layoutId="nav-dot"
            className="absolute -bottom-1 w-1 h-1 bg-slate-900 rounded-full"
          />
        )}
      </>
    )}
  </button>
);
