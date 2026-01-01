
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FourfoldIntro from './components/FourfoldIntro';
import ArticleBlock from './components/ArticleBlock';
import GenerativeCover from './components/GenerativeCover';
import FinalPrompt from './components/FinalPrompt';
import ArchiveList from './components/ArchiveList';
import ChatAgent from './components/ChatAgent'; 
import { generateDailyIssue } from './services/geminiService';
import { downloadRagDataset } from './services/exportService'; 
import { saveIssueToHistory, getHistory } from './services/historyService';
import { syncVaultToGoogleSheets, fetchVaultFromGoogleSheets } from './services/googleSheetsService';
import { DailyIssue, ContentMode, GenerationStatus, ViewMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<ContentMode>(ContentMode.DeepBrief);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Reader);
  const [data, setData] = useState<DailyIssue | null>(null);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loadingText, setLoadingText] = useState("Initializing.System...");

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5ctw8nzg504pAk-WzGJt9eapiBna2XIMjnFo73c76hca0pOgC2kPCh7eXg_2eOu46YQ/exec";

  useEffect(() => {
    const performBackgroundSync = async () => {
      console.log("TSA_SYSTEM: Starting background Vault synchronization...");
      try {
        const cloudIssues = await fetchVaultFromGoogleSheets(SCRIPT_URL);
        if (cloudIssues && cloudIssues.length > 0) {
          cloudIssues.forEach(issue => saveIssueToHistory(issue));
          console.log(`TSA_SYSTEM: Background sync complete. ${cloudIssues.length} issues merged.`);
        }
      } catch (e) {
        console.warn("TSA_SYSTEM: Background sync failed silently.", e);
      }
    };
    performBackgroundSync();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setStatus('generating');
      const phrases = [
        "Chapter 1: Entering the Curator's Room...",
        "Chapter 2: Building Architectures of Thought...",
        "Chapter 3: Designing the Syntax of Silence...",
        "Chapter 8: Calculating Aesthetic Logic..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(phrases[i % phrases.length]);
        i++;
      }, 3000);

      const result = await generateDailyIssue();
      clearInterval(interval);

      if (result) {
        setData(result);
        setStatus('success');
        saveIssueToHistory(result);
        syncVaultToGoogleSheets([result], SCRIPT_URL);
      } else {
        setStatus('error');
      }
    };
    fetchData();
  }, []);

  const handleDownloadJson = () => {
    if (!data) return;
    const success = downloadRagDataset(data);
    setSaveStatus(success ? 'success' : 'error');
    if (success) setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleArchiveSelect = (issue: DailyIssue) => {
    setData(issue);
    setViewMode(ViewMode.Reader);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-24 relative">
      
      {data && <GenerativeCover seed={data.date + data.theme} />}
      {!data && <GenerativeCover seed="Loading" />}

      <ChatAgent />

      <nav className="fixed top-6 left-6 z-50 mix-blend-multiply flex gap-4">
        <div className="bg-stone-900 text-stone-50 px-3 py-1 mono text-[10px] tracking-widest uppercase shadow-xl cursor-default">
           TSA v6.6
        </div>
        <button 
           onClick={() => setViewMode(viewMode === ViewMode.Reader ? ViewMode.Archive : ViewMode.Reader)}
           className={`mono text-[10px] tracking-widest uppercase px-3 py-1 border transition-all shadow-lg ${viewMode === ViewMode.Archive ? 'bg-stone-800 text-stone-50 border-stone-800' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-900'}`}
        >
           {viewMode === ViewMode.Reader ? 'Open.Vault' : 'Close.Vault'}
        </button>
      </nav>
      
      {viewMode === ViewMode.Reader && (
        <div className="fixed top-6 right-6 z-50 flex gap-2">
          <button onClick={() => setMode(ContentMode.DeepBrief)} className={`mono text-[10px] uppercase px-3 py-1 border transition-all ${mode === ContentMode.DeepBrief ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-stone-50/80 text-stone-500 border-stone-300 hover:border-stone-900'}`}>Deep_Brief</button>
          <button onClick={() => setMode(ContentMode.DailyDigest)} className={`mono text-[10px] uppercase px-3 py-1 border transition-all ${mode === ContentMode.DailyDigest ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-stone-50/80 text-stone-500 border-stone-300 hover:border-stone-900'}`}>Digest</button>
        </div>
      )}

      <main className="w-full max-w-6xl px-6 md:px-12 relative z-10 pt-32">
        {viewMode === ViewMode.Archive && (
          <ArchiveList onSelect={handleArchiveSelect} onClose={() => setViewMode(ViewMode.Reader)} />
        )}

        {viewMode === ViewMode.Reader && (
          <>
            {status === 'generating' ? (
              <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8">
                <div className="w-px h-24 bg-stone-300 animate-pulse"></div>
                <p className="mono text-xs uppercase tracking-[0.2em] text-stone-500 animate-pulse">{loadingText}</p>
              </div>
            ) : (
              <>
                {status === 'success' && data && (
                  <div className="animate-fadeIn">
                    <div className="-mt-32"> 
                       <Header date={data.date} theme={data.theme} themeSub={data.themeSub} intro={data.intro} articles={data.articles || []} onDownload={handleDownloadJson} saveStatus={saveStatus} />
                    </div>
                    <FourfoldIntro data={data.intro} />
                    <div className="flex flex-col gap-0">
                      {(data.articles || []).map((article, index) => (
                        <ArticleBlock key={article.id || index} article={article} mode={mode} index={index} />
                      ))}
                    </div>
                    {data.finalPrompt && <FinalPrompt text={data.finalPrompt} />}
                    
                    {/* 系統頁腳 (Footer) */}
                    <footer className="w-full border-t border-stone-300 pt-8 mt-12 mb-16 flex justify-between items-end opacity-50 hover:opacity-100 transition-opacity select-none group">
                      <div className="mono text-[9px] uppercase text-stone-400 leading-relaxed group-hover:text-stone-600 transition-colors">
                        System: <span className="text-green-600 font-bold animate-pulse">Active</span><br/>
                        Render: React 19.x<br/>
                        Engine: Gemini 3.0 Pro
                      </div>
                      <div className="font-serif text-lg italic text-stone-800 text-right">
                        "We do not make noise, only arrange rhythms."
                      </div>
                    </footer>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
