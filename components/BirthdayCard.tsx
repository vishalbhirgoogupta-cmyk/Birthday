
import React, { useState, useRef, useMemo } from 'react';
import { BirthdayWish } from '../types';
import { sfx } from '../utils/audio';
import * as htmlToImage from 'html-to-image';

interface BirthdayCardProps {
  wish: BirthdayWish;
  imageUrl: string;
  onReset: () => void;
}

type CardTheme = 'classic' | 'royal' | 'pop' | 'vintage' | 'neon';

const CardGlitter = ({ color }: { color: string }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-pulse"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            animation: `glitter-fade ${p.duration}s infinite ease-in-out ${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes glitter-fade {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

const BirthdayCard: React.FC<BirthdayCardProps> = ({ wish, imageUrl, onReset }) => {
  const [theme, setTheme] = useState<CardTheme>('classic');
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    sfx.playClick();
    onReset();
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    sfx.playClick();
    setIsDownloading(true);

    try {
      // Small buffer for rendering engine
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await htmlToImage.toJpeg(cardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff', 
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: false,
        style: {
          transform: 'none', 
          margin: '0',
          borderRadius: '2rem'
        },
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        }
      });

      const link = document.createElement('a');
      link.download = `Birthday_Card_${wish.title.replace(/\s+/g, '_')}.jpg`;
      link.href = dataUrl;
      link.click();
      
      sfx.playCelebration();
    } catch (err) {
      console.error('Download error:', err);
      try {
          const dataUrl = await htmlToImage.toPng(cardRef.current!, { pixelRatio: 1.5 });
          const link = document.createElement('a');
          link.download = `Birthday_Card_${wish.title.replace(/\s+/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
      } catch (innerErr) {
          alert('Download failed. Please take a screenshot instead!');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleThemeChange = (newTheme: CardTheme) => {
    sfx.playClick();
    setTheme(newTheme);
  };

  const themes = {
    classic: {
      container: 'bg-white border-rose-100',
      header: 'bg-rose-50 text-rose-600',
      text: 'text-gray-700',
      accent: 'bg-rose-50 border-rose-200 text-rose-500',
      rhyme: 'text-gray-800',
      button: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200',
      label: 'text-rose-500',
      glitter: '#fda4af'
    },
    royal: {
      container: 'bg-slate-900 border-amber-500/30 text-white',
      header: 'bg-slate-800/50 text-amber-400',
      text: 'text-slate-200',
      accent: 'bg-slate-800 border-amber-500/20 text-amber-300',
      rhyme: 'text-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-900',
      label: 'text-amber-400',
      glitter: '#fbbf24'
    },
    pop: {
      container: 'bg-gradient-to-br from-indigo-600 to-purple-600 border-cyan-400 text-white',
      header: 'bg-white/10 text-cyan-300',
      text: 'text-white',
      accent: 'bg-white/10 border-white/20 text-cyan-200',
      rhyme: 'text-white',
      button: 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-900',
      label: 'text-cyan-300',
      glitter: '#22d3ee'
    },
    vintage: {
      container: 'bg-[#fdf6e3] border-[#b58900]/30 text-[#586e75]',
      header: 'bg-[#eee8d5] text-[#b58900]',
      text: 'text-[#657b83]',
      accent: 'bg-[#eee8d5] border-[#b58900]/20 text-[#859900]',
      rhyme: 'text-[#586e75]',
      button: 'bg-[#b58900] hover:bg-[#a07a00] shadow-[#eee8d5]',
      label: 'text-[#b58900]',
      glitter: '#859900'
    },
    neon: {
      container: 'bg-black border-lime-400 text-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.3)]',
      header: 'bg-zinc-900 text-fuchsia-500',
      text: 'text-lime-300',
      accent: 'bg-zinc-900 border-lime-400/50 text-fuchsia-400',
      rhyme: 'text-lime-100',
      button: 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-900',
      label: 'text-fuchsia-500',
      glitter: '#a3e635'
    }
  };

  const active = themes[theme];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <style>{`
        @keyframes cardReveal {
          0% { opacity: 0; transform: perspective(1000px) scale(0.9) translateY(40px) rotateX(15deg); filter: blur(8px); }
          100% { opacity: 1; transform: perspective(1000px) scale(1) translateY(0) rotateX(0deg); filter: blur(0); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(250%) skewX(-25deg); }
        }
        .card-reveal-anim { animation: cardReveal 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .shimmer-layer {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          pointer-events: none; z-index: 40;
          animation: shimmerSweep 1.5s ease-in-out forwards; animation-delay: 1.2s;
        }

        @media print {
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; border-radius: 20px !important; margin: 0 auto !important; page-break-inside: avoid; }
        }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-4 mb-10 bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-rose-100 card-reveal-anim no-print" style={{ animationDelay: '0.1s' }}>
        <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Card Ka Design Chunein</span>
        <div className="flex flex-wrap justify-center gap-3">
          {(['classic', 'royal', 'pop', 'vintage', 'neon'] as CardTheme[]).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`px-6 py-2 rounded-full font-black text-xs transition-all capitalize border-2 ${
                theme === t 
                  ? 'bg-rose-500 text-white border-rose-500 shadow-lg scale-110' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-rose-200'
              }`}
            >
              {t} Theme
            </button>
          ))}
        </div>
      </div>

      <div className="print-container">
        <div ref={cardRef} className={`print-card ${active.container} rounded-[3rem] shadow-2xl overflow-hidden border-4 transform transition-all duration-700 card-reveal-anim relative`}>
          <CardGlitter color={active.glitter} />
          <div className="shimmer-layer no-print"></div>

          <div className={`relative h-64 md:h-96 w-full ${active.header.split(' ')[0]} flex items-center justify-center overflow-hidden`}>
            {imageUrl ? (
              <img src={imageUrl} alt="Celebration" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <h1 className={`cursive text-6xl ${active.header.split(' ')[1]} mb-4`}>Happy Birthday!</h1>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent opacity-60"></div>
            <div className="absolute bottom-10 left-8 right-8 text-center">
               <h2 className={`text-4xl md:text-5xl font-black ${active.header.split(' ')[1]} drop-shadow-2xl filter brightness-110 uppercase tracking-tighter`}>{wish.title}</h2>
            </div>
          </div>

          <div className="p-10 md:p-16 space-y-12 relative z-10">
            <div className="prose max-w-none flex justify-center">
              <p className={`text-3xl ${active.text} leading-relaxed italic text-center font-bold transition-all duration-300 max-w-2xl px-4`}>
                "{wish.message}"
              </p>
            </div>

            <div className={`${active.accent} p-10 rounded-[3rem] border-4 border-dashed relative group overflow-hidden shadow-inner`}>
               <div className="absolute top-0 right-0 p-6 opacity-10 text-8xl group-hover:rotate-12 transition-transform pointer-events-none no-print">✍️</div>
               <h3 className={`cursive text-4xl mb-6 text-center ${active.label}`}>Eak Pyari Kavita</h3>
               <pre className={`text-center font-sans text-2xl ${active.rhyme} whitespace-pre-wrap leading-relaxed italic font-medium`}>
                 {wish.poem}
               </pre>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className={`${active.accent} p-8 rounded-[2rem] border-none shadow-lg`}>
                <span className={`text-xs font-black uppercase tracking-widest ${active.label}`}>Quote</span>
                <p className={`font-bold mt-4 text-xl leading-snug`}>{wish.shortQuote}</p>
              </div>
              <div className={`${active.accent} p-8 rounded-[2rem] border-none shadow-lg`}>
                <span className={`text-xs font-black uppercase tracking-widest ${active.label}`}>Secret Legend</span>
                <p className={`font-bold mt-4 text-xl leading-snug`}>{wish.funFact}</p>
              </div>
            </div>

            <div className="pt-12 flex flex-col sm:flex-row justify-center items-center gap-6 no-print">
               <button 
                 onClick={handleReset}
                 className={`w-full sm:w-auto px-14 py-6 ${active.button} text-white rounded-full font-black text-2xl transition-all transform hover:-translate-y-2 shadow-2xl active:scale-95 border-b-8 border-black/20`}
               >
                 Naya Wish! ✨
               </button>
               <button 
                 onClick={handleDownload}
                 disabled={isDownloading}
                 className={`w-full sm:w-auto px-10 py-5 bg-gray-100/10 backdrop-blur-md border-4 border-white/20 text-inherit rounded-full font-black hover:bg-white/20 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {isDownloading ? (
                   <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                    Downloading...
                   </>
                 ) : (
                   <>Download Card 📄</>
                 )}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthdayCard;
