
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { DailyIssue, ChatMessage } from "../types";
import { CATEGORIES, INITIAL_PROMPT_SYSTEM } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const prepareVaultContext = (history: DailyIssue[]): string => {
  if (!history || history.length === 0) return "目前檔案庫尚無資料。";
  
  return history.map(issue => {
    const articles = issue.articles || [];
    return `
--- DOCUMENT: ${issue.date} ---
THEME: ${issue.theme} (${issue.themeSub})
INTRO MATRIX: 
- Keywords: ${issue.intro?.keywords || ""}
- Intersection: ${issue.intro?.intersection || ""}
- Future Vector: ${issue.intro?.vector || ""}
- Reflection: ${issue.intro?.reflection || ""}

FRAGMENTS:
${articles.map((a, i) => `[${i+1}] ${a.categoryName}: ${a.focusSentence}\nAnalysis: ${a.body}`).join('\n')}
---------------------------
`;
  }).join('\n\n');
};

export const startCuratorChat = async (history: DailyIssue[]) => {
  const vaultData = prepareVaultContext(history);
  
  const systemInstruction = `
You are "The Curator v2.0", the resident AI agent of The Silent Architect.
Your mission is to provide sharp synthesis and visual analysis based on the Vault below.

KNOWLEDGE BASE:
${vaultData}

TONE: Intellectual, structural, Taiwan Traditional Chinese.
`;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.6,
    }
  });
};

export const generateDailyIssue = async (): Promise<DailyIssue | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    const aiClient = new GoogleGenAI({ apiKey });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 2); // 搜尋範圍擴大至 48 小時以確保資料品質
    const searchAfterDate = yesterday.toISOString().split('T')[0];

    // 核心搜尋指令：強化連結真實性
    const searchPrompt = `
    ACTION: Perform a deep scan of architectural intelligence after ${searchAfterDate}.
    ANTI-404 PROTOCOL:
    - Step 1: Use Google Search to find 6 high-quality news fragments.
    - Step 2: Extract the ACTUAL URL (URI) from grounding metadata for each.
    - Step 3: If an article is interesting but the direct link is unavailable/unstable, use "SEARCH_QUERY:[Headline]" as the link.
    - Step 4: Map each fragment to a unique TSA category.
    - Step 5: Deliver exactly 6 fragments in the specified JSON format.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: INITIAL_PROMPT_SYSTEM,
        temperature: 0.3, // 降低溫度以減少幻覺風險
      }
    });

    let text = response.text || "";
    // 清洗 Markdown 代碼塊
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    
    const parsed = JSON.parse(text) as DailyIssue;
    
    if (!parsed.articles) parsed.articles = [];
    
    // 二次校驗：確保 articles 數目（不在此報錯，交由後端邏輯處理）
    return parsed;
  } catch (e) {
    console.error("TSA_SERVICE: Generation failed", e);
    return null;
  }
};
