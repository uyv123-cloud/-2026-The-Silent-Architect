
import React, { useMemo } from 'react';
import { Article, ContentMode } from '../types';

interface Props {
  article: Article;
  mode: ContentMode;
  index: number;
}

const ArticleBlock: React.FC<Props> = ({ article, mode, index }) => {
  const isDeep = mode === ContentMode.DeepBrief;
  const displayIndex = (index + 1).toString().padStart(2, '0');

  const { finalLink, isSearch, domainLabel, pathLabel } = useMemo(() => {
    let link = article.link || "";
    let isSearchMode = false;
    let domain = "VERIFY_SOURCE";
    let path = "/index";

    if (link.startsWith('SEARCH_QUERY:')) {
      const query = link.replace('SEARCH_QUERY:', '');
      link = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      isSearchMode = true;
      domain = "GOOGLE_SEARCH";
      path = "/query_results";
    } 
    else if (!link.startsWith('http')) {
      link = `https://www.google.com/search?q=${encodeURIComponent(article.focusSentence)}`;
      isSearchMode = true;
      domain = "ARCHIVE_SCAN";
    }
    else {
      try {
        const url = new URL(link);
        domain = url.hostname.replace('www.', '').toUpperCase();
        path = url.pathname.length > 30 ? url.pathname.substring(0, 30) + "..." : url.pathname;
        if (path === "/") path = "/index";
        if (url.pathname === "" || url.pathname === "/") isSearchMode = true;
      } catch (e) {
        link = `https://www.google.com/search?q=${encodeURIComponent(article.focusSentence)}`;
        isSearchMode = true;
      }
    }
    return { finalLink: link, isSearch: isSearchMode, domainLabel: domain, pathLabel: path };
  }, [article.link, article.focusSentence]);

  return (
    <article className="group relative py-12 md:py-16 w-full z-10 transition-layout">
      
      {/* Structural Hairline - Tighter spacing */}
      <div className="w-full h-[0.5px] bg-stone-200 relative mb-12 transition-colors duration-1000 group-hover:bg-stone-400">
        <div className="absolute top-0 left-0 w-8 h-[1.5px] bg-stone-900 group-hover:w-20 transition-all duration-1000"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        
        {/* COL 1: Index - Re-scaled for tightness */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col justify-between items-baseline lg:items-start border-b lg:border-b-0 border-stone-100 pb-6 lg:pb-0">
          <div className="mono text-[5rem] md:text-[7.5rem] lg:text-[9rem] text-stone-200 group-hover:text-stone-900 transition-all duration-700 font-extralight tracking-tighter leading-none -ml-2 lg:-ml-6 select-none">
            {displayIndex}
          </div>
          <div className="mt-4 lg:mt-8 space-y-4">
             <div className="hidden lg:block w-px h-10 bg-stone-200 group-hover:h-16 transition-all duration-700"></div>
             <div className="mono text-[9px] uppercase tracking-[0.4em] text-stone-400 font-bold">
               {article.categoryCode} // {article.categoryName}
             </div>
          </div>
        </div>

        {/* COL 2: Content Narrative */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          
          <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-stone-900 tracking-tight max-w-4xl transition-all">
            {article.focusSentence}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 items-start">
             <div className="md:col-span-7">
                <p className="font-sans text-sm md:text-base font-light leading-[1.9] text-stone-600 text-justify border-l border-stone-100 pl-8 transition-all group-hover:border-stone-900 group-hover:text-stone-800">
                  {article.body}
                </p>

                {/* Precision Link UI */}
                <div className="mt-12 pl-8">
                  <a 
                    href={finalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-8 group/link no-underline py-3 pr-4 border-b border-stone-200 hover:border-stone-900 transition-all duration-500"
                  >
                    <div className="flex flex-col">
                       <div className="flex items-baseline gap-3 mb-1">
                          <span className="mono text-[11px] font-bold text-stone-800 tracking-widest group-hover/link:text-black">
                             {domainLabel}
                          </span>
                          <span className="mono text-[7px] text-stone-300 uppercase tracking-[0.3em]">
                             {isSearch ? 'SEARCH_MOD' : 'VERIFIED_IDX'}
                          </span>
                       </div>
                       <span className="mono text-[9px] text-stone-400 group-hover/link:text-stone-500 transition-colors tracking-tight">
                          {pathLabel}
                       </span>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full border border-stone-50 flex items-center justify-center group-hover/link:bg-stone-900 group-hover/link:text-stone-50 transition-all">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                         <path d="M7 17l9.2-9.2M17 17V7H7" />
                      </svg>
                    </div>
                  </a>
                </div>
             </div>

             {/* Side Meta: Precise Content Labels */}
             {isDeep && (
               <div className="md:col-span-5 space-y-8 md:pl-8 md:border-l border-stone-100">
                  {article.lineage && (
                    <div className="opacity-50 group-hover:opacity-100 transition-all duration-700">
                      <span className="mono text-[9px] uppercase font-bold tracking-[0.4em] text-stone-400 block mb-3">SOURCE_CONTEXT</span>
                      <p className="font-serif text-[13px] italic text-stone-500 leading-relaxed font-light">
                        {article.lineage}
                      </p>
                    </div>
                  )}
                  {article.futureSpeak && (
                    <div className="bg-stone-50/30 p-6 border-l-[0.5px] border-stone-200 transition-all group-hover:bg-white group-hover:border-stone-900 duration-700">
                      <span className="mono text-[9px] uppercase font-bold tracking-[0.4em] text-stone-900 block mb-3">VECTOR_PREDICTION</span>
                      <p className="font-sans text-[12px] text-stone-600 leading-[1.8] italic font-light">
                        {article.futureSpeak}
                      </p>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArticleBlock;
