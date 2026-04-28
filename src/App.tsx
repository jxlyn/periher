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
const WEEKLY_PLAN: PlanItem[] = [
  { id: '1', type: 'exercise', title: '20-minute Strength Training', description: 'Focus on core and bone health.', productRecommendation: { name: 'Resistance Band Set', image: 'https://picsum.photos/seed/bands/200/200', link: '#' } },
  { id: '2', type: 'nutrition', title: 'High-Protein Breakfast', description: 'Greek yogurt with berries and flaxseeds.', productRecommendation: { name: 'Plant-based Protein', image: 'https://picsum.photos/seed/protein/200/200', link: '#' } },
  { id: '3', type: 'lifestyle', title: 'Sleep Routine', description: 'No screens 30 mins before bed. Lavender mist.' },
  { id: '4', type: 'exercise', title: '30-minute Brisk Walk', description: 'Get some fresh air and vitamin D.' },
  { id: '5', type: 'nutrition', title: 'Magnesium-Rich Dinner', description: 'Spinach, pumpkin seeds, and salmon.' },
];

const INSIGHTS: Insight[] = [
  { id: '1', text: "I noticed your sleep improves on days you walk.", type: 'positive' },
  { id: '2', text: "Your energy levels drop after nights with less than 6 hours of sleep.", type: 'observation' },
  { id: '3', text: "Brain fog symptoms are 30% lower when you hit your protein goals.", type: 'positive' },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'Symptom Streak', description: '5-day symptom tracking streak', icon: '🔥', progress: 5, target: 7, completed: false },
  { id: '2', title: 'Workout Warrior', description: '3 workouts completed this week', icon: '💪', progress: 3, target: 3, completed: true },
  { id: '3', title: 'Sleep Milestone', description: 'Average 7.5h sleep this week', icon: '🌙', progress: 7.5, target: 8, completed: false },
];

const CHART_DATA = [
  { day: 'Mon', sleep: 6.5, mood: 3, energy: 4 },
  { day: 'Tue', sleep: 7.2, mood: 4, energy: 5 },
  { day: 'Wed', sleep: 5.8, mood: 2, energy: 3 },
  { day: 'Thu', sleep: 8.0, mood: 5, energy: 6 },
  { day: 'Fri', sleep: 7.5, mood: 4, energy: 5 },
  { day: 'Sat', sleep: 7.8, mood: 5, energy: 7 },
  { day: 'Sun', sleep: 7.0, mood: 4, energy: 5 },
];

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

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
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
    onLog({ exercise });
    setStep('type');
  };

  const handleNutritionSubmit = () => {
    onLog({ nutrition });
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
            className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-medium text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            Start Your Journey
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

const HomeScreen = ({ userName, saveStatus, onSymptomSelect, onPlanItemClick, preferences, setPreferences, onLog, onLogout }: { userName: string, saveStatus: string, onSymptomSelect: (s: Symptom) => void, onPlanItemClick: (item: any) => void, preferences: UserPreferences, setPreferences: (p: UserPreferences) => void, onLog: (log: Partial<DailyLog>) => void, onLogout: () => void }) => {
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

  const [selectedPlanItem, setSelectedPlanItem] = useState<any | null>(null);

  const currentPlan = (selectedSymptom && preferences.autoAdaptPlan) ? adaptedPlan : defaultPlan;

  const handleLog = async (log: Partial<DailyLog>) => {
    setTrigger(prev => prev + 1);
    setIsAiLoading(true);
    onLog(log);
    
    try {
      const logType = log.exercise ? 'exercise' : 'nutrition';
      const logDetail = log.exercise 
        ? `${log.exercise.duration}min of ${log.exercise.type} at ${log.exercise.intensity} intensity`
        : `${log.nutrition?.meal} (${log.nutrition?.tags.join(', ')})`;
      
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
            className="text-[8px] font-bold uppercase tracking-widest text-slate-300 hover:text-rose-400 transition-colors"
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
          <span className="text-[10px] font-bold text-lavender-400 uppercase tracking-[0.2em]">March 17</span>
        </div>

        <div className="space-y-4">
          {currentPlan.map((item, idx) => (
            <motion.div 
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              onClick={() => setSelectedPlanItem(item)}
              className="flex items-center gap-5 p-5 bg-white rounded-[2rem] border border-warm-200 soft-shadow group hover:border-lavender-200 transition-all cursor-pointer active:scale-95"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.color, item.text)}>
                <item.icon size={24} />
              </div>
              <div className="flex-1">
                <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mb-1", item.text)}>{item.type}</p>
                <p className="font-medium text-slate-800">{item.title}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-warm-50 flex items-center justify-center text-slate-300">
                <ChevronRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedPlanItem && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-warm-50 overflow-y-auto"
          >
            <div className="relative min-h-screen">
              {/* Header with Close Button */}
              <div className="sticky top-0 z-20 bg-warm-50/80 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-warm-100">
                <button 
                  onClick={() => setSelectedPlanItem(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors soft-shadow"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lavender-400">Daily Detail</p>
                  <h3 className="serif text-xl font-medium text-slate-800">Your Full Plan</h3>
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Reusing Plan Content Style */}
              <div className="p-8 space-y-12 pb-24">
                <section className="bg-white rounded-[3rem] p-8 soft-shadow border border-warm-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", selectedPlanItem.color, selectedPlanItem.text)}>
                      <selectedPlanItem.icon size={28} />
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mb-1", selectedPlanItem.text)}>{selectedPlanItem.type}</p>
                      <h4 className="serif text-2xl font-medium text-slate-800">{selectedPlanItem.title}</h4>
                    </div>
                  </div>
                  <p className="text-slate-500 leading-relaxed font-light mb-8">
                    {selectedPlanItem.description}
                  </p>
                  
                  <div className="p-6 bg-warm-50 rounded-[2rem] border border-warm-100">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Why this works today:</h5>
                    <p className="text-sm text-slate-600 font-light leading-relaxed">
                      Based on your current cycle phase and reported symptoms, this activity is optimized to support your hormonal balance and energy levels.
                    </p>
                  </div>
                </section>

                {/* The rest of the plan content (simplified or full) */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="serif text-2xl font-medium text-slate-800">Other Recommendations</h3>
                    <span className="text-[10px] font-bold text-lavender-400 uppercase tracking-[0.2em]">Full List</span>
                  </div>
                  
                  <div className="space-y-4">
                    {WEEKLY_PLAN.filter(i => i.id !== selectedPlanItem.id).slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-6 rounded-[2rem] soft-shadow border border-warm-100 flex items-center gap-4">
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
                    onPlanItemClick(selectedPlanItem);
                  }}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-medium soft-shadow hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Plan Tab <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlanAndInsightsScreen = ({ logs }: { logs: DailyLog[] }) => {
  const [view, setView] = useState<'plan' | 'insights'>('plan');
  const [planMode, setPlanMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getLogsForDay = (day: number) => {
    // In a real app, we'd check the actual date. For this demo, we'll mock it.
    // We'll assume the logs are for March 2026.
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.getDate() === day;
    });
  };

  const selectedDayLogs = getLogsForDay(selectedDate);

  return (
    <div className="space-y-8 pb-32 px-8 pt-12">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="serif text-4xl font-light text-slate-900">{view === 'plan' ? 'Your Plan' : 'Insights'}</h2>
          <p className="text-slate-400 mt-2 font-light">{view === 'plan' ? 'Curated for your cycle.' : 'Patterns in your wellness.'}</p>
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
                    <Card key={item.id} className="p-6 rounded-[2rem] soft-shadow border-warm-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-lg">{item.title}</h4>
                          <p className="text-sm text-slate-400 mt-1 font-light">{item.description}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-sage-50 text-sage-500 flex items-center justify-center">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                      {item.productRecommendation && (
                        <div className="mt-6 p-4 bg-warm-50 rounded-2xl flex items-center gap-4 border border-warm-100 group cursor-pointer hover:bg-white transition-colors">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-warm-200">
                            <img src={item.productRecommendation.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[9px] font-bold text-lavender-400 uppercase tracking-[0.2em] mb-1">Recommended</p>
                            <p className="text-sm font-medium text-slate-700">{item.productRecommendation.name}</p>
                          </div>
                          <ShoppingBag size={18} className="text-slate-300 group-hover:text-lavender-400 transition-colors" />
                        </div>
                      )}
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
                    <Card key={item.id} className="p-6 rounded-[2rem] soft-shadow border-warm-100">
                      <h4 className="font-semibold text-slate-800 text-lg">{item.title}</h4>
                      <p className="text-sm text-slate-400 mt-1 font-light">{item.description}</p>
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
                {Array.from({ length: 31 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === 17;
                  const hasPlan = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31].includes(dayNum);
                  
                  return (
                    <motion.div 
                      key={i} 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedDate(dayNum)}
                      className={cn(
                        "aspect-square rounded-2xl flex flex-col items-center justify-center relative border transition-all duration-300 cursor-pointer",
                        selectedDate === dayNum ? "bg-slate-900 text-white border-slate-900 soft-shadow" : "bg-white border-warm-100 text-slate-500",
                        dayNum === 17 && selectedDate !== 17 && "border-lavender-400",
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
                        {log.exercise && (
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-sage-50 text-sage-500 flex items-center justify-center shrink-0">
                              <Dumbbell size={20} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-800">{log.exercise.type}</h5>
                              <p className="text-xs text-slate-400 mt-1">{log.exercise.duration} min · {log.exercise.intensity} intensity</p>
                            </div>
                          </div>
                        )}
                        {log.nutrition && (
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                              <Utensils size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h5 className="font-semibold text-slate-800">{log.nutrition.meal}</h5>
                                {log.nutrition.weight && <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">{log.nutrition.weight}</span>}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {log.nutrition.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[9px] font-bold rounded-full uppercase">{tag}</span>
                                ))}
                              </div>
                              {log.nutrition.image && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-rose-100 aspect-video">
                                  <img src={log.nutrition.image} alt="Meal" className="w-full h-full object-cover" />
                                </div>
                              )}
                              {log.nutrition.aiAnalysis && (
                                <div className="mt-3 p-3 bg-lavender-50/50 rounded-xl border border-lavender-100">
                                  <p className="text-[10px] font-bold text-lavender-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Sparkles size={10} /> AI Insight
                                  </p>
                                  <p className="text-xs text-slate-600 italic font-light leading-relaxed">"{log.nutrition.aiAnalysis}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="mt-8 p-8 bg-lavender-50/50 border-lavender-100 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-lavender-500 soft-shadow">
                        <Sparkles size={20} />
                      </div>
                      <h4 className="serif text-xl font-medium text-slate-800">{selectedDate === 17 ? "Today's Focus" : `Focus for March ${selectedDate}`}</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-light italic">
                      {selectedDate === 17 
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
                <div className="w-2 h-2 rounded-full bg-sage-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Energy</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const ProgressScreen = ({ preferences, setPreferences, achievements, trigger, setTrigger }: { preferences: UserPreferences, setPreferences: (p: UserPreferences) => void, achievements: Achievement[], trigger: number, setTrigger: React.Dispatch<React.SetStateAction<number>> }) => {
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
                <p className="text-3xl font-light text-slate-900 serif">7</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Day Streak</p>
              </Card>
            </div>

            <section className="space-y-6">
              <h3 className="serif text-2xl font-medium text-slate-800 px-2">Recent Milestones</h3>
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
                    <span>8 / 10 days</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '80%' }}
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
                  { title: 'Wellness Goodie Bag', type: 'Real-world', progress: 15, target: 30, icon: ShoppingBag, color: 'bg-rose-50 text-rose-500' },
                  { title: 'Golden Crown Accessory', type: 'Virtual', progress: 5, target: 7, icon: Gem, color: 'bg-yellow-50 text-yellow-500' },
                  { title: '1-Month Premium Subscription', type: 'Real-world', progress: 45, target: 90, icon: Zap, color: 'bg-blue-50 text-blue-500' },
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

const AskPeriHerScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello Amber. I'm here to support you. Is there anything on your mind today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    try {
      if (view === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || 'Amber', // Defaulting to Amber if empty
            }
          }
        });
        if (signUpError) throw signUpError;
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError("Rate limit exceeded. Please wait a moment or disable 'Confirm Email' in your Supabase Auth settings to bypass this during testing.");
      } else {
        setError(err.message);
      }
    } finally {
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

// --- Main App ---

export default function App() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [session, setSession] = useState<Session | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'progress' | 'ask'>('home');
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [trigger, setTrigger] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    autoAdaptPlan: true,
    notificationsEnabled: true,
    avatar: {
      base: 'default',
      accessories: ['glasses'],
      unlockedAccessories: ['glasses', 'hat', 'scarf']
    }
  });

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        setIsStarted(true);
        fetchHistoricalLogs(session.user.id);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsStarted(true);
        setAuthView(null);
        fetchHistoricalLogs(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistoricalLogs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedLogs: DailyLog[] = data.map((item: any) => ({
          id: item.id || item.created_at,
          date: item.log_date,
          timestamp: new Date(item.log_date).getTime(),
          symptom: item.symptom?.type || item.symptom,
          mood: item.mood_score?.toString(),
          exercise: item.activity_log ? JSON.parse(item.activity_log) : undefined,
          nutrition: item.diet_log ? JSON.parse(item.diet_log) : undefined,
        }));
        setLogs(mappedLogs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleLog = async (log: Partial<DailyLog>) => {
    setSaveStatus('saving');
    const newLog: DailyLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      timestamp: Date.now(),
      ...log
    };
    setLogs(prev => [newLog, ...prev]);
    setTrigger(prev => prev + 1);
    
    // Save to Supabase if session exists
    if (session?.user) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Fetch today's existing log to merge
        const { data: existingData } = await supabase
          .from('symptom_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('log_date', today)
          .single();

        // 2. Prepare the payload (merging with existing if found)
        const dbLog = {
          user_id: session.user.id,
          log_date: today,
          // symptom is NOT NULL in your schema, so we MUST provide at least an empty object
          symptom: log.symptom ? { type: log.symptom } : (existingData?.symptom || {}), 
          severity: 1, 
          diet_log: log.nutrition ? JSON.stringify(log.nutrition) : (existingData?.diet_log || null),
          activity_log: log.exercise ? JSON.stringify(log.exercise) : (existingData?.activity_log || null),
          mood_score: log.mood ? parseInt(log.mood) || 5 : (existingData?.mood_score || 5),
          energy_score: 5,
          created_at: existingData?.created_at || new Date().toISOString(),
        };

        // 3. Upsert into Supabase
        const { error, status, statusText } = await supabase
          .from('symptom_logs')
          .upsert(dbLog, { onConflict: 'user_id,log_date' });
        
        if (error) {
          console.error('Supabase DB Error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            status,
            statusText
          });
          throw error;
        }
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        console.error('Error saving log to Supabase:', err);
        setSaveStatus('error');
        // Check for RLS errors specifically
        if (err.message?.includes('policy')) {
          console.warn("RLS Policy missing: Ensure you have an 'Enable Insert/Update for users' policy on symptom_logs table in Supabase.");
        }
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
    await supabase.auth.signOut();
    setIsStarted(false);
  };

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
                userName={session?.user?.user_metadata?.display_name || 'Amber'}
                saveStatus={saveStatus}
                onSymptomSelect={(s) => {
                  setHasCheckedIn(true);
                  handleLog({ symptom: s });
                }} 
                onPlanItemClick={() => setActiveTab('plan')}
                preferences={preferences}
                setPreferences={setPreferences}
                onLog={handleLog}
                onLogout={handleLogout}
              />
            )}
            {activeTab === 'plan' && <PlanAndInsightsScreen logs={logs} />}
            {activeTab === 'ask' && <AskPeriHerScreen />}
            {activeTab === 'progress' && (
              <ProgressScreen 
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
