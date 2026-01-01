
import React, { useState, useEffect, useRef } from 'react';
import { DailyIssue, ChatMessage } from '../types';
import { startCuratorChat } from '../services/geminiService';
import { getHistory } from '../services/historyService';
import { GoogleGenAI } from "@google/genai";

/**
 * 簡易 Markdown 渲染器元件
 */
const FormattedMessage: React.FC<{ text: string, role: 'user' | 'model', imageUrl?: string }> = ({ text, role, imageUrl }) => {
  if (role === 'user') return (
    <div className="space-y-3">
      {imageUrl && <img src={imageUrl} alt="Uploaded source" className="max-w-full h-auto border border-stone-300 shadow-inner grayscale contrast-125" />}
      <p>{text}</p>
    </div>
  );

  const lines = text.split('\n');
  
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (line.startsWith('###')) {
          return (
            <div key={i} className="pt-4 pb-1 border-b border-stone-100 mb-2">
              <h4 className="font-serif text-lg italic text-stone-900 leading-tight">
                {line.replace('###', '').trim()}
              </h4>
            </div>
          );
        }
        
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className="flex gap-3 pl-2">
              <span className="mono text-[8px] mt-1.5 text-stone-400">●</span>
              <p className="text-sm text-stone-700 leading-relaxed">
                {renderBold(line.trim().substring(2))}
              </p>
            </div>
          );
        }

        if (line.trim() === '') return <div key={i} className="h-2"></div>;

        return (
          <p key={i} className="text-sm text-stone-800 leading-relaxed text-justify">
            {renderBold(line)}
          </p>
        );
      })}
    </div>
  );
};

const renderBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-stone-950 px-0.5">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const ChatAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<(ChatMessage & { imageUrl?: string })[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [systemTime, setSystemTime] = useState("");
  
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const initChat = async () => {
    const history = getHistory();
    const session = await startCuratorChat(history);
    chatSessionRef.current = session;
    
    setMessages([{
      role: 'model',
      text: "我是 TSA 檔案庫的策展專員 (The Curator)。我已準備好進行「視覺解析」與「智慧跨域推演」。您可以輸入查詢，或上傳設計草圖進行多維度診斷。"
    }]);
  };

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      initChat();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || !chatSessionRef.current || isTyping) return;

    const userMsgText = inputValue;
    const userImg = selectedImage;
    setInputValue("");
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: 'user', text: userMsgText, imageUrl: userImg || undefined }]);
    setIsTyping(true);

    try {
      let responseText = "";
      if (userImg) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
        const base64Data = userImg.split(',')[1];
        const mimeType = userImg.split(';')[0].split(':')[1];
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: `基於 TSA 檔案庫內容，請解析此圖片：${userMsgText}` }
            ]
          }
        });
        responseText = response.text || "解析失敗。";
      } else {
        const response = await chatSessionRef.current.sendMessage({ message: userMsgText });
        responseText = response.text || "系統暫時失去回應。";
      }
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "連線異常，請重試。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[90] bg-stone-100/10 backdrop-blur-[2px] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div ref={agentContainerRef} className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
        
        <div 
          className={`w-[90vw] md:w-[500px] h-[650px] bg-white border border-stone-300 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col mb-3 origin-bottom-right transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${
            isOpen 
            ? 'opacity-100 scale-100 translate-y-0 translate-x-0' 
            : 'opacity-0 scale-[0.8] translate-y-12 translate-x-6 pointer-events-none'
          }`}
        >
          <div className="bg-stone-900 p-4 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                <span className="mono text-[10px] uppercase tracking-widest text-stone-300 italic">Curator_v2.5 // Vault_Access</span>
             </div>
             <div className="flex items-center gap-4">
               <span className="hidden md:block mono text-[8px] text-stone-500 uppercase tracking-tighter">ESC_to_Close</span>
               <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white transition-colors p-1">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
             </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin bg-stone-50/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="mono text-[8px] uppercase tracking-widest text-stone-400">
                    {msg.role === 'user' ? 'SIGNAL_IN' : 'INTELLIGENCE_OUT'}
                  </span>
                  <div className="h-px w-6 bg-stone-100"></div>
                </div>
                
                <div className={`w-full max-w-[95%] p-5 shadow-sm border transition-all duration-500 ${
                  msg.role === 'user' 
                    ? 'bg-stone-100 text-stone-800 border-stone-200 rounded-bl-xl' 
                    : 'bg-white text-stone-900 border-stone-300 border-l-4 border-l-stone-900'
                }`}>
                  <FormattedMessage text={msg.text} role={msg.role} imageUrl={msg.imageUrl} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex flex-col items-start px-2">
                <span className="mono text-[8px] uppercase text-stone-400 mb-3 animate-pulse">Processing_Neural_Fragments...</span>
                <div className="flex gap-1">
                  {[0,1,2].map(d => <div key={d} className="w-1 h-4 bg-stone-900 animate-bounce" style={{animationDelay: `${d*0.1}s`}}></div>)}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-stone-100 bg-white">
            {selectedImage && (
              <div className="mb-4 relative w-20 h-20 group">
                <img src={selectedImage} className="w-full h-full object-cover border border-stone-900 shadow-sm" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-stone-900 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            
            <div className="flex gap-4 items-end">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 border border-stone-200 hover:border-stone-900 text-stone-400 hover:text-stone-900 transition-all rounded-sm flex flex-col items-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span className="mono text-[8px] uppercase">Image</span>
              </button>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />

              <textarea 
                rows={1}
                placeholder="PROMPT_COMMAND..."
                className="flex-1 bg-transparent border-b border-stone-200 py-2 mono text-xs focus:outline-none focus:border-stone-900 uppercase resize-none min-h-[32px]"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              
              <button 
                onClick={handleSend}
                disabled={isTyping || (!inputValue.trim() && !selectedImage)}
                className="bg-stone-900 text-white px-4 py-2 mono text-[10px] uppercase font-bold hover:bg-stone-700 disabled:bg-stone-200 transition-all"
              >
                [EXE]
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex items-center gap-2.5 bg-stone-900 text-stone-50 px-4 py-2.5 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.4)] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] animate-curator-breath ${isOpen ? 'opacity-0 scale-75 pointer-events-none translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
        >
          <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
            <div className="w-full h-[1px] bg-stone-100 absolute top-0 animate-scanner"></div>
          </div>

          <div className="absolute -top-3.5 right-0 mono text-[6px] text-stone-400 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
             <span>{systemTime}</span>
             <span className="animate-pulse">V_SYNC</span>
          </div>

          <div className="flex flex-col items-start leading-none">
             <span className="mono text-[7px] uppercase tracking-[0.3em] text-stone-500 mb-0.5 group-hover:text-stone-300 transition-colors">Intelligence</span>
             <span className="mono text-[11px] uppercase tracking-wider font-bold flex items-center gap-1">
               Curator
               <span className="mono text-[7px] font-normal opacity-30">v2.5</span>
             </span>
          </div>

          <div className="w-px h-4 bg-stone-800 group-hover:h-6 transition-all duration-500"></div>

          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="absolute inset-0 border border-stone-600 rounded-sm animate-spin-slow group-hover:border-stone-400"></div>
            <div className="w-1.5 h-1.5 bg-green-500/80 rounded-[1px] shadow-[0_0_8px_#22c55e] transition-all group-hover:rotate-[360deg] duration-700"></div>
            <div className="absolute -top-0.5 -left-0.5 w-0.5 h-0.5 border-t border-l border-stone-500"></div>
            <div className="absolute -bottom-0.5 -right-0.5 w-0.5 h-0.5 border-b border-r border-stone-500"></div>
          </div>
        </button>

        <style>{`
          @keyframes curator-breath {
            0%, 100% { transform: scale(1); box-shadow: 0 15px 35px -5px rgba(0,0,0,0.4); }
            50% { transform: scale(0.99); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.25); }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes scanner {
            0% { top: -10%; }
            100% { top: 110%; }
          }
          .animate-curator-breath {
            animation: curator-breath 5s ease-in-out infinite;
          }
          .animate-spin-slow {
            animation: spin-slow 15s linear infinite;
          }
          .animate-scanner {
            animation: scanner 4s linear infinite;
          }
        `}</style>
      </div>
    </>
  );
};

export default ChatAgent;
