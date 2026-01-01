
import React from 'react';

interface Props {
  text: string;
}

const FinalPrompt: React.FC<Props> = ({ text }) => {
  return (
    <section className="w-full py-32 md:py-48 border-t border-stone-200 relative z-10 flex flex-col items-center justify-center text-center px-6 transition-layout">
      
      <div className="mb-10">
        <span className="mono text-[9px] uppercase tracking-[0.6em] text-stone-400 font-bold">
          CHAPTER_FINAL // THE_INQUIRY
        </span>
      </div>

      <div className="max-w-3xl relative group">
        <span className="absolute -top-16 -left-12 font-display text-[10rem] text-stone-200/50 opacity-40 select-none leading-none italic pointer-events-none group-hover:text-stone-300 transition-colors duration-1000">“</span>
        
        <h3 className="font-serif text-3xl md:text-5xl italic leading-[1.6] text-stone-800 relative z-10 font-light px-8 transition-layout">
          {text}
        </h3>
        
        <span className="absolute -bottom-20 -right-12 font-display text-[10rem] text-stone-200/50 opacity-40 select-none leading-none italic pointer-events-none group-hover:text-stone-300 transition-colors duration-1000">”</span>
      </div>

      <div className="mt-24 flex flex-col items-center gap-8">
         <div className="w-px h-24 bg-stone-200 group-hover:h-32 transition-all duration-[1.5s]"></div>
         <p className="mono text-[8px] text-stone-400 uppercase tracking-[0.8em] animate-pulse">
           SYSTEM_RECALIBRATING
         </p>
      </div>

    </section>
  );
};

export default FinalPrompt;
