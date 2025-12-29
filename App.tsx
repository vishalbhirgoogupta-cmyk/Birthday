
import React, { useState, useEffect } from 'react';
import { BirthdayWish, WishFormData, AppState } from './types';
import { generateBirthdayWish, generateBirthdayImage } from './services/geminiService';
import Confetti from './components/Confetti';
import BirthdayCard from './components/BirthdayCard';
import CakeInteraction from './components/CakeInteraction';
import { sfx } from './utils/audio';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [formData, setFormData] = useState<WishFormData>({
    name: '',
    age: '',
    relation: 'Friend',
    tone: 'heartfelt',
    language: 'hinglish'
  });
  const [generatedWish, setGeneratedWish] = useState<BirthdayWish | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appState === AppState.DISPLAYING) {
      sfx.playCelebration();
    }
  }, [appState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    sfx.playClick();
    setAppState(AppState.GENERATING);
    setError(null);

    try {
      // Start both but wait for the wish primarily
      // If image fails, it returns '' which is handled by Card component
      const wishPromise = generateBirthdayWish(formData);
      const imagePromise = generateBirthdayImage(formData.name);

      const wish = await wishPromise;
      const img = await imagePromise;

      setGeneratedWish(wish);
      setImageUrl(img);
      setAppState(AppState.DISPLAYING);
    } catch (err: any) {
      console.error("App Generation Failure:", err);
      setError(err.message || "Kuch technical error aa gaya hai. Kripya dobara koshish karein!");
      setAppState(AppState.IDLE);
    }
  };

  const startCakeTime = () => {
    sfx.playClick();
    setAppState(AppState.CAKE_TIME);
  };

  const reset = () => {
    sfx.playClick();
    setAppState(AppState.IDLE);
    setGeneratedWish(null);
    setImageUrl('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#fff5f7] relative overflow-x-hidden">
      <div className="no-print">
        {appState === AppState.DISPLAYING && <Confetti />}
      </div>
      
      {appState === AppState.CAKE_TIME && <CakeInteraction name={formData.name} onClose={() => setAppState(AppState.DISPLAYING)} />}

      <header className={`py-14 text-center px-4 no-print ${appState !== AppState.IDLE ? 'hidden sm:block' : ''}`}>
        <div className="inline-block relative">
           <span className="absolute -top-10 -left-12 text-6xl float-animation">🎈</span>
           <span className="absolute -top-8 -right-14 text-6xl float-animation" style={{ animationDelay: '1.5s' }}>🎂</span>
           <h1 className="text-6xl md:text-8xl font-extrabold text-rose-600 cursive tracking-tight drop-shadow-lg">
             Birthday Wish Magic
           </h1>
        </div>
        <p className="mt-6 text-gray-500 max-w-xl mx-auto text-xl font-medium">
          Personalized AI birthday surprises, magic cakes, and cards!
        </p>
      </header>

      <main className="container mx-auto pb-24 px-4">
        {appState === AppState.IDLE && (
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-rose-100 transform hover:scale-[1.01] transition-transform no-print">
            <h2 className="text-3xl font-black text-gray-800 mb-10 text-center uppercase tracking-tighter">Details Bhariye ✨</h2>
            <form onSubmit={handleGenerate} className="space-y-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Birthday Star's Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Rahul, Priya, Mummy, Papa..."
                  required
                  className="w-full px-6 py-4 rounded-2xl border-2 border-rose-50 bg-rose-50/30 focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Age (optional)</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="25"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-rose-50 bg-rose-50/30 focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Relation</label>
                  <input
                    type="text"
                    name="relation"
                    value={formData.relation}
                    onChange={handleInputChange}
                    placeholder="Bestie, Bhai, Boss..."
                    className="w-full px-6 py-4 rounded-2xl border-2 border-rose-50 bg-rose-50/30 focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Mood / Tone</label>
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-rose-50 bg-rose-50/30 focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-lg font-bold appearance-none cursor-pointer"
                  >
                    <option value="heartfelt">Heartfelt ❤️</option>
                    <option value="funny">Funny 😂</option>
                    <option value="grand">Grand/Epic 👑</option>
                    <option value="poetic">Poetic ✍️</option>
                    <option value="sarcastic">Sarcastic 😏</option>
                    <option value="emotional">Very Emotional 😭</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-rose-50 bg-rose-50/30 focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-lg font-bold appearance-none cursor-pointer"
                  >
                    <option value="hinglish">Hinglish 🇮🇳</option>
                    <option value="english">English 🇺🇸</option>
                    <option value="hindi">Hindi 🚩</option>
                    <option value="punjabi">Punjabi 🥁</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake">
                  <p className="text-red-500 text-sm font-bold text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-rose-200 transform hover:-translate-y-2 transition-all text-2xl uppercase tracking-tighter active:scale-95 border-b-8 border-rose-800"
              >
                Create Magic Wish! ✨
              </button>
            </form>
          </div>
        )}

        {appState === AppState.GENERATING && (
          <div className="flex flex-col items-center justify-center py-24 space-y-10 no-print">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-[12px] border-rose-100 rounded-full shadow-inner"></div>
              <div className="absolute inset-0 border-[12px] border-rose-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center animate-pulse">
               <h3 className="text-4xl font-black text-rose-600 uppercase tracking-tighter">Baking Magic...</h3>
               <p className="text-gray-500 mt-4 italic text-xl">AI is crafting a special surprise for {formData.name}</p>
            </div>
          </div>
        )}

        {appState === AppState.DISPLAYING && generatedWish && (
          <div className="space-y-12 animate-in zoom-in duration-700">
            <div className="flex flex-col items-center gap-4 no-print">
              <button 
                onClick={startCakeTime}
                className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white px-12 py-6 rounded-full font-black text-3xl shadow-[0_20px_50px_rgba(244,63,94,0.4)] hover:scale-110 transform transition-all animate-bounce border-b-8 border-rose-800"
              >
                🎂 Surprise Cake Cutting!
              </button>
              <p className="text-rose-500 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Don't miss the cake!</p>
            </div>
            <BirthdayCard wish={generatedWish} imageUrl={imageUrl} onReset={reset} />
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 pointer-events-none flex justify-between items-end opacity-20 no-print">
         <span className="text-8xl">🍰</span>
         <span className="text-8xl">🎈</span>
         <span className="text-8xl">🎁</span>
      </footer>
    </div>
  );
};

export default App;
