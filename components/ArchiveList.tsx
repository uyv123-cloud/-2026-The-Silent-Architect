
import React, { useState, useEffect, useCallback } from 'react';
import { DailyIssue } from '../types';
import { getHistory, searchHistory, saveIssueToHistory } from '../services/historyService';
import { fetchVaultFromGoogleSheets } from '../services/googleSheetsService';

interface Props {
  onSelect: (issue: DailyIssue) => void;
  onClose: () => void;
}

const ArchiveList: React.FC<Props> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DailyIssue[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5ctw8nzg504pAk-WzGJt9eapiBna2XIMjnFo73c76hca0pOgC2kPCh7eXg_2eOu46YQ/exec";

  const refreshArchive = useCallback(async () => {
    setResults(getHistory());
    setIsSyncing(true);
    try {
      const cloudIssues = await fetchVaultFromGoogleSheets(SCRIPT_URL);
      if (cloudIssues && cloudIssues.length > 0) {
        cloudIssues.forEach(issue => saveIssueToHistory(issue));
        setResults(getHistory());
      }
    } catch (e) {} finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { refreshArchive(); }, [refreshArchive]);

  return (
    <div className="w-full animate-fadeIn min-h-[80vh] pb-32">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-stone-900 pb-12 gap-8">
        <div>
          <div className="flex items-center gap-6 mb-4">
            <h2 className="font-display text-6xl md:text-8xl text-stone-900 italic font-light tracking-tighter">
              The Vault
            </h2>
            <div className={`px-3 py-1 border border-stone-200 rounded-full flex items-center gap-2 ${isSyncing ? 'animate-pulse' : ''}`}>
               <div className="w-1 h-1 bg-stone-900 rounded-full"></div>
               <span className="mono text-[8px] uppercase tracking-widest text-stone-400">
                 {isSyncing ? 'Syncing' : 'Connected'}
               </span>
            </div>
          </div>
          <p className="mono text-[10px] uppercase tracking-[0.4em] text-stone-500">
            Digital Records // {results.length} Fragments Indexed
          </p>
        </div>

        <div className="w-full md:w-80">
           <input 
             type="text" 
             placeholder="QUERY_IDENTIFIER..." 
             value={query}
             onChange={(e) => { setQuery(e.target.value); setResults(searchHistory(e.target.value)); }}
             className="w-full bg-transparent border-b border-stone-300 py-3 mono text-xs uppercase tracking-widest text-stone-900 focus:outline-none focus:border-stone-900 transition-colors placeholder:text-stone-200"
           />
        </div>
      </div>

      <div className="space-y-0">
        {results.map((issue) => (
          <div 
            key={`${issue.date}_${issue.theme}`}
            onClick={() => onSelect(issue)}
            className="group flex flex-col md:grid md:grid-cols-12 py-12 border-b border-stone-100 cursor-pointer hover:bg-stone-50/50 transition-all duration-500 px-4 -mx-4"
          >
            <div className="md:col-span-3 space-y-1">
              <span className="mono text-[10px] uppercase tracking-widest text-stone-400 block group-hover:text-stone-900 transition-colors">
                {issue.date}
              </span>
              <span className="mono text-[8px] text-stone-300">[{issue.articles.length} FRAGMENTS]</span>
            </div>

            <div className="md:col-span-7 pt-4 md:pt-0">
              <h3 className="font-serif text-4xl italic text-stone-800 group-hover:text-black transition-colors leading-none mb-2">
                {issue.theme}
              </h3>
              <p className="font-sans text-[11px] uppercase tracking-widest text-stone-400 font-light">
                {issue.themeSub}
              </p>
            </div>

            <div className="md:col-span-2 flex justify-end items-center pt-6 md:pt-0">
               <div className="w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all duration-700">
                  <span className="mono text-xs">→</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-40 flex flex-col items-center">
         <button onClick={onClose} className="mono text-[10px] uppercase tracking-[0.5em] text-stone-400 hover:text-stone-900 transition-all border-b border-transparent hover:border-stone-900 pb-2">
           [ Return_to_Current ]
         </button>
      </div>

    </div>
  );
};

export default ArchiveList;
