
import { DailyIssue, Article } from "../types";

/**
 * 輔助函式：確保日期格式一致
 */
const formatCloudDate = (rawDate: any): string => {
  if (!rawDate) return "";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate); 
    
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return String(rawDate);
  }
};

/**
 * 輔助函式：從 API 回傳的 Row 物件中尋找對應的 Key
 * 使用嚴格的正規化比對，確保帶數字的欄位（如 02 / Intersection）能正確匹配
 */
const getVal = (row: any, key: string): any => {
  if (!row || typeof row !== 'object') return "";
  
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const searchKey = normalize(key);
  
  const actualKey = Object.keys(row).find(k => normalize(k) === searchKey);
  return actualKey ? row[actualKey] : "";
};

export const syncVaultToGoogleSheets = async (issues: DailyIssue[], manualUrl?: string): Promise<{ success: boolean; message: string }> => {
  const scriptUrl = manualUrl || "https://script.google.com/macros/s/AKfycbx5ctw8nzg504pAk-WzGJt9eapiBna2XIMjnFo73c76hca0pOgC2kPCh7eXg_2eOu46YQ/exec";

  try {
    const payload = { timestamp: new Date().toISOString(), issues: issues };
    
    await fetch(scriptUrl, { 
      method: "POST", 
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload) 
    });
    
    return { success: true, message: "Sync.Success: Data Pushed" };
  } catch (error) {
    console.error("Cloud Sync Failed", error);
    return { success: false, message: "Sync.Error: Connection Failed" };
  }
};

export const fetchVaultFromGoogleSheets = async (manualUrl?: string): Promise<DailyIssue[]> => {
  const scriptUrl = manualUrl || "https://script.google.com/macros/s/AKfycbx5ctw8nzg504pAk-WzGJt9eapiBna2XIMjnFo73c76hca0pOgC2kPCh7eXg_2eOu46YQ/exec";

  try {
    console.log("TSA_VAULT: Fetching data from Cloud...");
    const response = await fetch(scriptUrl, { method: "GET", redirect: "follow" });
    
    if (!response.ok) {
      console.error("TSA_VAULT: Cloud response not OK", response.status);
      return [];
    }
    
    const rawRows = await response.json();
    if (!Array.isArray(rawRows)) {
      console.error("TSA_VAULT: Data is not an array");
      return [];
    }

    console.log(`TSA_VAULT: Received ${rawRows.length} rows from Cloud.`);

    const issuesMap: Record<string, DailyIssue> = {};

    rawRows.forEach((row: any) => {
      const rawDateVal = getVal(row, "Date");
      const dateVal = formatCloudDate(rawDateVal);
      const themeVal = String(getVal(row, "Theme") || "Untitled");
      
      if (!dateVal || dateVal === "Invalid Date") return;

      const groupKey = `${dateVal}_${themeVal}`;

      if (!issuesMap[groupKey]) {
        // 映射到使用者提供的精確欄位名稱
        issuesMap[groupKey] = {
          date: dateVal,
          theme: themeVal,
          themeSub: String(getVal(row, "Theme Sub") || ""),
          intro: {
            keywords: String(getVal(row, "Keywords") || ""),
            intersection: String(getVal(row, "02 / Intersection") || ""),
            vector: String(getVal(row, "03 / Future Vector") || ""),
            reflection: String(getVal(row, "04 / Reflection") || "")
          },
          articles: [],
          finalPrompt: String(getVal(row, "Chapter 09 / The Final Prompt") || "")
        };
      }

      const focusSentence = String(getVal(row, "Focus Sentence") || "");
      if (focusSentence && !issuesMap[groupKey].articles.some(a => a.focusSentence === focusSentence)) {
        issuesMap[groupKey].articles.push({
          id: Math.random().toString(36).substring(2, 11),
          categoryCode: "XX", 
          categoryName: String(getVal(row, "Category") || "Uncategorized"),
          focusSentence: focusSentence,
          body: String(getVal(row, "Body") || ""),
          link: String(getVal(row, "Link") || "#"),
          lineage: String(getVal(row, "Lineage") || ""),
          // 這裡對應文章層級的 Future Vector
          futureSpeak: String(getVal(row, "Future Vector") || "")
        });
      }
    });

    const finalResult = Object.values(issuesMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log(`TSA_VAULT: Successfully reconstructed ${finalResult.length} daily issues with full Intro Matrix.`);
    return finalResult;
  } catch (error) {
    console.error("TSA_VAULT: Retrieval failed:", error);
    return [];
  }
};
