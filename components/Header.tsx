
import React, { useState } from 'react';
import { Article, FourfoldIntro } from '../types';
import { downloadNotebookLMSource } from '../services/exportService';

interface HeaderProps {
  date: string;
  theme: string;
  themeSub: string;
  intro: FourfoldIntro;
  articles: Article[];
  onDownload?: () => void;
  saveStatus?: 'idle' | 'success' | 'error';
}

const Header: React.FC<HeaderProps> = ({ 
  date, theme, themeSub, articles = [], onDownload, saveStatus = 'idle'
}) => {
  const [copyText, setCopyText] = useState("Copy.Text");

  const handleCopyContent = async () => {
    try {
      const fullText = `TSA Vol 6.8\nDate: ${date}\nTheme: ${theme}\n\n` + 
        articles.map((a, i) => `#${(i+1).toString().padStart(2,'0')} ${a.focusSentence}\n${a.body}\nLink: ${a.link}`).join('\n\n');
      await navigator.clipboard.writeText(fullText);
      setCopyText("Text.Copied");
      setTimeout(() => setCopyText("Copy.Text"), 2000);
    } catch (err) {}
  };

  return (
    <header className="relative w-full pt-16 pb-12 md:pt-24 md:pb-16 mb-10 select-none z-10 transition-layout">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        
        {/* Left: Document Metadata */}
        <div className="lg:col-span-4 flex flex-col justify-between">
           <div className="space-y-4">
             <div className="mono text-[10px] tracking-[0.4em] uppercase text-stone-400 font-bold">
               DOC_ID // {date}
             </div>
             <div className="w-16 h-[1.5px] bg-stone-900"></div>
           </div>
           
           <div className="hidden lg:block pt-12">
              <p className="mono text-[8px] text-stone-300 uppercase leading-[2.4] tracking-[0.3em] font-light">
                Curation as architecture<br/>
                Algorithmic observation<br/>
                The aesthetics of silence
              </p>
           </div>
        </div>

        {/* Right: Monumental Typographic Cluster - JetBrains Mono v6.0 */}
        <div className="lg:col-span-8 flex flex-col items-start lg:items-end text-left lg:text-right">
           <h1 className="mono font-light text-6xl md:text-8xl lg:text-9xl leading-[0.9] text-stone-900 tracking-tighter mb-8 transition-layout">
             The Silent<br/>Architect
           </h1>
           
           <div className="w-full max-w-xl border-t-[0.5px] border-stone-900 pt-6 mt-2 group flex flex-col items-start lg:items-end">
              <div className="w-full flex justify-between items-baseline mb-4">
                <span className="mono text-[10px] uppercase font-bold tracking-[0.4em] text-stone-900">SYSTEM_THEME</span>
                <span className="mono text-[10px] text-stone-300 group-hover:text-stone-900 transition-colors">v6.0_BLUEPRINT</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl font-light italic text-stone-800 leading-tight mb-3">
                {theme}
              </h2>
              <p className="font-sans text-xs md:text-sm font-light text-stone-500 tracking-widest uppercase leading-relaxed">
                {themeSub}
              </p>
           </div>
           
           {/* Actions Bar */}
           <div className="flex flex-wrap gap-3 mt-8 justify-start lg:justify-end opacity-40 hover:opacity-100 transition-opacity duration-700">
              <button onClick={handleCopyContent} className="mono text-[9px] uppercase border border-stone-200 px-5 py-2 hover:bg-stone-900 hover:text-stone-50 transition-all tracking-widest">
                {copyText}
              </button>
              <button onClick={() => downloadNotebookLMSource({date, theme, themeSub, articles, intro: {} as any, finalPrompt: ""})} className="mono text-[9px] uppercase border border-stone-200 px-5 py-2 hover:bg-stone-900 hover:text-stone-50 transition-all tracking-widest">
                  Export.NotebookLM
              </button>
              {onDownload && (
                <button onClick={onDownload} className="mono text-[9px] uppercase border border-stone-200 px-5 py-2 hover:bg-stone-900 hover:text-stone-50 transition-all tracking-widest">
                   {saveStatus === 'success' ? 'Saved' : 'Dataset.JSON'}
                </button>
              )}
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
