
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { sfx } from '../utils/audio';

interface CakeInteractionProps {
  name: string;
  onClose: () => void;
}

// Fixed Sparkle component typing to resolve key prop error
const Sparkle: React.FC<{ delay: number }> = ({ delay }) => {
  // Stable random positions so sparkles don't jump on every re-render
  const pos = useMemo(() => ({
    top: `${Math.random() * 60 + 10}%`,
    left: `${Math.random() * 60 + 10}%`,
    rotate: `${Math.random() * 360}deg`,
    scale: Math.random() * 0.5 + 0.8
  }), []);

  return (
    <div 
      className="absolute pointer-events-none z-[60]"
      style={{
        top: pos.top,
        left: pos.left,
        transform: `scale(${pos.scale}) rotate(${pos.rotate})`,
        animation: `sparkle-anim 1.2s ease-in-out forwards ${delay}s`,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="#FFD700" />
      </svg>
    </div>
  );
};

// Fixed Candle component typing for consistency
const Candle: React.FC<{ lit: boolean; volume: number }> = ({ lit, volume }) => {
  // Base flicker + microphone intensity
  const baseFlicker = Math.sin(Date.now() / 100) * 0.1;
  const micIntensity = Math.min(volume / 35, 3.0);
  const totalIntensity = 0.2 + micIntensity;
  
  return (
    <div className="relative w-4 h-16 flex flex-col items-center">
      {lit && (
        <div 
          className="absolute -top-8 w-6 h-10 flex flex-col items-center origin-bottom transition-all duration-75"
          style={{ 
            transform: `scale(${1 + totalIntensity * 0.15}) rotate(${Math.sin(Date.now() / 60) * totalIntensity * 3}deg)`,
            filter: `blur(${0.4 + totalIntensity * 0.4}px)`
          }}
        >
          {/* Outer Flame Glow */}
          <div className="absolute w-8 h-12 bg-orange-600 rounded-full opacity-30 animate-flame-flicker"></div>
          {/* Main Flame */}
          <div className="absolute top-1 w-5 h-9 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full shadow-[0_0_20px_rgba(251,146,60,0.9)] animate-flame-flicker"></div>
          {/* Inner Flame Core */}
          <div className="absolute top-3 w-2 h-6 bg-white rounded-full opacity-95"></div>
          {/* Bottom Blue Core */}
          <div className="absolute bottom-0 w-4 h-2 bg-blue-400 rounded-full opacity-70 blur-[1px]"></div>
        </div>
      )}
      <div className="w-0.5 h-3 bg-gray-900 rounded-full z-10 -mb-1"></div>
      <div className="w-4 h-14 bg-gradient-to-b from-rose-400 via-rose-500 to-rose-600 rounded-full shadow-lg relative overflow-hidden border-x border-rose-300">
        <div className="absolute inset-0 bg-white/30 skew-x-12 -translate-x-1"></div>
        {/* Candle Stripes */}
        <div className="absolute inset-0 flex flex-col gap-2 opacity-20 py-2">
            {[1,2,3].map(i => <div key={i} className="h-1 bg-white rotate-12"></div>)}
        </div>
      </div>
    </div>
  );
};

const CakeInteraction: React.FC<CakeInteractionProps> = ({ name, onClose }) => {
  const [candlesLit, setCandlesLit] = useState(true);
  const [cakeCut, setCakeCut] = useState(false);
  const [isOpeningGift, setIsOpeningGift] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [showSongPicker, setShowSongPicker] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      
      // Explicit resume for browser security
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);
    } catch (err) {
      console.warn("Microphone access denied or unavailable:", err);
    }
  };

  useEffect(() => {
    startListening();
    return () => {
      // Cleanup all media resources
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isListening || !candlesLit) return;
    let animationId: number;
    const checkVolume = () => {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      
      setVolume(average);

      // Higher sensitivity threshold for blowing
      if (average > 70) {
        setCandlesLit(false);
        setVolume(0);
        sfx.playCheer();
        setShowSongPicker(true);
        streamRef.current?.getTracks().forEach(track => track.stop());
      } else {
        animationId = requestAnimationFrame(checkVolume);
      }
    };
    animationId = requestAnimationFrame(checkVolume);
    return () => cancelAnimationFrame(animationId);
  }, [isListening, candlesLit]);

  const handleCutCake = () => {
    sfx.playClick();
    sfx.playCheer();
    setCakeCut(true);
    setTimeout(() => {
      sfx.playCelebration();
    }, 500);
  };

  const handleOpenGift = () => {
    if (isOpeningGift || giftOpened) return;
    sfx.playClick();
    setIsOpeningGift(true);
    
    setTimeout(() => {
      sfx.playCelebration();
      setGiftOpened(true);
      setIsOpeningGift(false);
    }, 1000);
  };

  const playSelectedSong = (style: 'classic' | 'pop' | 'jazz') => {
    setShowSongPicker(false);
    sfx.playBirthdaySong(style);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 transition-colors duration-1000 overflow-y-auto ${candlesLit ? 'bg-black/95' : 'bg-[#fff5f7] backdrop-blur-xl'}`}>
      <style>{`
        @keyframes sparkle-anim {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          40% { transform: scale(1.8) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes flame-flicker {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.9; }
          25% { transform: scale(1.08, 0.92) translateY(-1px); opacity: 1; }
          50% { transform: scale(0.92, 1.08) translateY(0); opacity: 0.8; }
          75% { transform: scale(1.04, 0.96) translateY(-0.5px); opacity: 0.95; }
        }
        .animate-flame-flicker { animation: flame-flicker 0.1s infinite alternate ease-in-out; }
        
        .cake-body {
          position: relative;
          width: 280px;
          height: 180px;
          background: #f48fb1;
          border-radius: 120px / 40px;
          box-shadow: 0 10px 0 #f06292, 0 20px 0 #8d6e63;
        }
        .cake-top {
          position: absolute;
          top: -30px;
          width: 100%;
          height: 80px;
          background: white;
          border-radius: 120px / 40px;
          z-index: 2;
          display: flex;
          justify-content: center;
          align-items: center;
          border-bottom: 5px solid #fce4ec;
        }
        .drip {
          position: absolute;
          top: 30px;
          width: 20px;
          height: 35px;
          background: white;
          border-radius: 0 0 20px 20px;
          z-index: 1;
        }
        .slice-cut {
          transition: all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center;
        }
        .cake-cut-active .slice-cut {
          transform: translate(70px, 50px) rotate(15deg);
          opacity: 0.9;
        }
        .cake-main-body {
          transition: all 0.8s ease;
        }
        .cake-cut-active .cake-main-body {
          transform: translateX(-35px);
        }
      `}</style>
      
      <div className="max-w-2xl w-full flex flex-col items-center relative">
        <h2 className={`cursive text-6xl md:text-8xl text-center mb-6 transition-colors duration-1000 ${candlesLit ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.7)]' : 'text-rose-600 animate-bounce'}`}>
          Happy Birthday, {name}!
        </h2>
        
        <p className={`mb-14 text-center text-xl italic transition-colors duration-1000 ${candlesLit ? 'text-gray-300' : 'text-gray-600'}`}>
          {candlesLit ? "Hawa mein wish mangiye aur blow kijiye!" : "Maza aa gaya! Cake taiyaar hai."}
        </p>

        <div className={`relative mt-20 mb-32 h-64 flex flex-col items-center ${cakeCut ? 'cake-cut-active' : ''}`}>
          
          <div className="absolute -bottom-10 w-80 h-10 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full shadow-2xl border-b-4 border-amber-800 z-0"></div>
          
          <div className="absolute -top-16 flex gap-8 z-50">
            {candlesLit && (
              <>
                <Candle lit={candlesLit} volume={volume} />
                <Candle lit={candlesLit} volume={volume} />
                <Candle lit={candlesLit} volume={volume} />
              </>
            )}
          </div>

          <div className="relative cake-main-body">
            <div className="cake-body">
               <div className="cake-top">
                  <div className="flex gap-4">
                     {[1,2,3,4].map(i => <div key={i} className="w-5 h-5 bg-red-600 rounded-full shadow-inner"></div>)}
                  </div>
               </div>
               <div className="drip" style={{ left: '10%' }}></div>
               <div className="drip" style={{ left: '30%', height: '45px' }}></div>
               <div className="drip" style={{ left: '55%', height: '25px' }}></div>
               <div className="drip" style={{ left: '80%', height: '40px' }}></div>
            </div>

            {!cakeCut && (
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-10 z-10 flex flex-wrap gap-2 justify-center opacity-60">
                 {Array.from({length: 15}).map((_, i) => (
                   <div key={i} className="w-2 h-0.5 rounded-full" style={{ backgroundColor: ['#ffeb3b', '#2196f3', '#4caf50', '#ff5722'][i%4], transform: `rotate(${i*45}deg)` }}></div>
                 ))}
               </div>
            )}
          </div>

          <div className={`absolute top-0 slice-cut ${cakeCut ? 'visible' : 'invisible pointer-events-none'}`}>
             <div className="w-24 h-40 bg-rose-400 rounded-lg shadow-xl relative overflow-hidden border-r-4 border-rose-300">
                <div className="absolute top-0 w-full h-8 bg-white border-b-2 border-rose-100"></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-white/30"></div>
                <div className="absolute bottom-0 w-full h-1/3 bg-[#8d6e63]"></div>
             </div>
             {cakeCut && Array.from({length: 12}).map((_, i) => <Sparkle key={i} delay={i * 0.08} />)}
          </div>

          {!candlesLit && !cakeCut && !showSongPicker && (
            <div className="absolute -right-36 top-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce cursor-pointer group/knife" onClick={handleCutCake}>
              <div className="text-8xl filter drop-shadow-2xl group-hover/knife:rotate-[-45deg] transition-transform duration-500">🔪</div>
              <span className="text-sm font-black text-rose-600 uppercase tracking-tighter mt-4 bg-white px-8 py-3 rounded-full shadow-2xl border-4 border-rose-50 transform group-hover/knife:scale-110 transition-all">Cake Kaato!</span>
            </div>
          )}
        </div>

        <div className="mt-12 text-center space-y-8 w-full px-4 min-h-[400px]">
          {candlesLit ? (
            <div className="bg-white/5 p-12 rounded-[5rem] border border-white/10 shadow-3xl animate-in zoom-in duration-700 flex flex-col items-center backdrop-blur-md">
              <div className="text-9xl mb-8 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">🌬️</div>
              <p className="text-yellow-400 font-black text-5xl mb-4 tracking-tighter uppercase text-center leading-none">Mombatti Bujhaayein!</p>
              
              <div className="w-72 h-4 bg-white/20 rounded-full overflow-hidden mt-8 border border-white/5 p-1 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(volume * 1.5, 100)}%` }}
                ></div>
              </div>

              <p className="text-white/30 text-xs mt-10 font-black uppercase tracking-[0.6em]">Mic active - Phoonk maariye</p>
              <button 
                onClick={() => { setCandlesLit(false); sfx.playCheer(); setShowSongPicker(true); }} 
                className="px-12 py-4 mt-10 bg-white/10 text-white/80 text-sm rounded-full hover:bg-white/30 transition-all border border-white/10 font-black uppercase tracking-widest"
              >
                Direct Party Shuru Karein
              </button>
            </div>
          ) : showSongPicker ? (
            <div className="bg-white/95 p-14 rounded-[5rem] shadow-3xl animate-in zoom-in border-[12px] border-rose-50 flex flex-col items-center backdrop-blur-2xl">
              <div className="text-6xl mb-6">🎵</div>
              <p className="text-4xl font-black text-rose-600 mb-10 uppercase tracking-tighter text-center">Gana Bajayein? 🎶</p>
              <div className="flex flex-wrap justify-center gap-6">
                <button onClick={() => playSelectedSong('classic')} className="px-10 py-6 bg-rose-500 text-white rounded-[2.5rem] font-black text-xl hover:scale-105 transition-all shadow-xl active:scale-95 border-b-8 border-rose-800">
                  🎹 CLASSIC
                </button>
                <button onClick={() => playSelectedSong('pop')} className="px-10 py-6 bg-indigo-500 text-white rounded-[2.5rem] font-black text-xl hover:scale-105 transition-all shadow-xl active:scale-95 border-b-8 border-indigo-800">
                  🎸 POP ROCK
                </button>
                <button onClick={() => playSelectedSong('jazz')} className="px-10 py-6 bg-amber-500 text-white rounded-[2.5rem] font-black text-xl hover:scale-105 transition-all shadow-xl active:scale-95 border-b-8 border-amber-800">
                  🎷 JAZZ MIX
                </button>
              </div>
            </div>
          ) : !cakeCut ? (
            <div className="flex flex-col items-center space-y-10 animate-in slide-in-from-bottom-16">
               <div className="flex gap-10">
                  <span className="text-7xl animate-bounce">🎈</span>
                  <span className="text-7xl animate-pulse">✨</span>
                  <span className="text-7xl animate-bounce">🎈</span>
               </div>
               <p className="text-4xl font-black text-gray-800 bg-white/95 px-16 py-10 rounded-[4rem] shadow-3xl border-b-[12px] border-rose-100 uppercase tracking-tighter text-center leading-none">Cake kaatne ka samay!</p>
               <button 
                onClick={handleCutCake}
                className="bg-rose-500 text-white px-28 py-12 rounded-full font-black text-6xl shadow-3xl hover:bg-rose-600 transform hover:scale-105 active:scale-95 transition-all border-b-[12px] border-rose-900"
              >
                SLICE KAATO! 🔪
              </button>
            </div>
          ) : (
            <div className="animate-in zoom-in duration-600 space-y-12 bg-white p-16 rounded-[6rem] shadow-3xl border-[16px] border-rose-50 flex flex-col items-center max-w-2xl w-full min-h-[500px]">
              {!giftOpened ? (
                <div className="flex flex-col items-center w-full">
                  <p className="text-4xl font-black text-gray-800 mb-12 text-center uppercase tracking-tighter leading-none">Eak surprise box! 🎁</p>
                  <div 
                    onClick={handleOpenGift}
                    className={`w-56 h-56 bg-gradient-to-br from-rose-100 via-rose-50 to-rose-300 rounded-[4rem] flex items-center justify-center text-[10rem] cursor-pointer shadow-3xl border-4 border-white relative group ${isOpeningGift ? 'animate-ping' : 'animate-pulse'}`}
                  >
                    🎁
                    {!isOpeningGift && <div className="absolute -top-8 -right-8 w-20 h-20 bg-rose-500 rounded-full animate-ping opacity-50"></div>}
                  </div>
                  <p className="mt-12 text-rose-600 font-black animate-bounce uppercase tracking-[0.4em] text-lg bg-rose-50 px-12 py-3 rounded-full border-2 border-rose-100 shadow-md">Kholo Jaldi!</p>
                </div>
              ) : (
                <div className="text-center space-y-14 reveal-content w-full">
                  <div className="text-[12rem] animate-bounce filter drop-shadow-3xl">🎉</div>
                  <div className="space-y-8">
                    <p className="text-6xl font-black text-rose-600 tracking-tighter leading-none">Janamdin Mubarak!</p>
                    <p className="text-3xl text-gray-600 leading-relaxed font-bold italic px-4">"Khushi se bhara rahe aapka har din."</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="bg-gray-900 text-white px-20 py-10 rounded-[3rem] font-black text-3xl shadow-3xl hover:bg-black transform hover:-translate-y-3 active:translate-y-0 transition-all w-full border-b-[12px] border-black/60"
                  >
                    CARD DEKHEIN ✨
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CakeInteraction;
