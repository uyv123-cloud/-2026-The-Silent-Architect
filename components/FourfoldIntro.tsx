
import React from 'react';
import { FourfoldIntro as IntroType } from '../types';

interface Props {
  data: IntroType;
}

const FourfoldIntro: React.FC<Props> = ({ data }) => {
  return (
    <section className="mb-20 w-full relative z-10 transition-layout">
      
      <div className="flex items-center gap-6 mb-10">
         <span className="mono text-[10px] uppercase tracking-[0.5em] text-stone-400 font-bold">
           CONFIGURATION_MATRIX // INTRO
         </span>
         <div className="h-[0.5px] flex-1 bg-stone-200"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 border-[0.5px] border-stone-200 bg-stone-50/20">
        {[
          { label: '01 / KEYWORDS', content: data.keywords, italic: true, size: 'text-2xl md:text-3xl' },
          { label: '02 / INTERSECTION', content: data.intersection, italic: false, size: 'text-base md:text-lg' },
          { label: '03 / FUTURE_VECTOR', content: data.vector, italic: false, size: 'text-base md:text-lg' },
          { label: '04 / REFLECTION', content: data.reflection, italic: false, size: 'text-base md:text-lg' }
        ].map((item, idx) => (
          <div key={idx} className="p-8 md:p-12 border-[0.5px] border-stone-100 hover:bg-white transition-all duration-700 group">
             <span className="mono text-[8px] uppercase tracking-[0.4em] text-stone-300 block mb-6 group-hover:text-stone-900 group-hover:translate-x-1 transition-all">
               {item.label}
             </span>
             <p className={`font-serif ${item.size} ${item.italic ? 'italic' : ''} text-stone-800 leading-relaxed font-light transition-layout`}>
               {item.content}
             </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FourfoldIntro;
