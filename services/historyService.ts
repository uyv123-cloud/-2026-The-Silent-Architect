
import { DailyIssue } from "../types";

const STORAGE_KEY = 'TSA_ARCHIVE_V6';

// --- SEED DATA ---
const SEED_DATA: DailyIssue[] = [
  {
    date: "Saturday, April 12, 2025",
    theme: "Digital Brutalism",
    themeSub: "數位粗獷主義",
    intro: {
      keywords: "Raw Data, Concrete, Glitch, Permanence",
      intersection: "Where the weight of concrete meets the weightlessness of code.",
      vector: "Towards a heavy, tactile internet.",
      reflection: "Can a website age like a concrete bunker?"
    },
    articles: [],
    finalPrompt: "Is the server farm the new cathedral?"
  }
];

export const saveIssueToHistory = (issue: DailyIssue) => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    let history: DailyIssue[] = existingStr ? JSON.parse(existingStr) : [];
    
    if (history.length === 0) {
        history = [...SEED_DATA];
    }

    // Composite key check: Date + Theme (to prevent collision if multiple sessions per day)
    const index = history.findIndex(item => 
      item.date === issue.date && item.theme === issue.theme
    );
    
    if (index !== -1) {
      // Merge Strategy: Keep the one with more articles, or update with newest if identical
      const existingArticlesCount = history[index].articles.length;
      const newArticlesCount = issue.articles.length;

      // Only overwrite if new data is more complete or essentially the same freshness
      if (newArticlesCount >= existingArticlesCount) {
        history[index] = issue;
      }
    } else {
      // New record
      history.unshift(issue);
    }
    
    // Maintain a reasonable limit for local cache (e.g., 50 issues)
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save to history", e);
  }
};

export const getHistory = (): DailyIssue[] => {
  try {
    const str = localStorage.getItem(STORAGE_KEY);
    let data = str ? JSON.parse(str) : [];
    if (data.length === 0) {
        data = [...SEED_DATA];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    // Sort by date descending
    return data.sort((a: DailyIssue, b: DailyIssue) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (e) {
    return [];
  }
};

export const searchHistory = (query: string): DailyIssue[] => {
  const data = getHistory();
  if (!query) return data;
  
  const lowerQ = query.toLowerCase().trim();

  return data.filter(issue => {
    if (
      issue.date.toLowerCase().includes(lowerQ) ||
      issue.theme.toLowerCase().includes(lowerQ) ||
      issue.themeSub.toLowerCase().includes(lowerQ) ||
      (issue.finalPrompt && issue.finalPrompt.toLowerCase().includes(lowerQ))
    ) {
      return true;
    }

    if (issue.intro) {
      if (
        issue.intro.keywords.toLowerCase().includes(lowerQ) ||
        issue.intro.intersection.toLowerCase().includes(lowerQ) ||
        issue.intro.vector.toLowerCase().includes(lowerQ) ||
        issue.intro.reflection.toLowerCase().includes(lowerQ)
      ) {
        return true;
      }
    }

    if (issue.articles && Array.isArray(issue.articles)) {
       return issue.articles.some(article => {
         return (
           article.focusSentence.toLowerCase().includes(lowerQ) ||
           article.body.toLowerCase().includes(lowerQ) ||
           article.categoryName.toLowerCase().includes(lowerQ) ||
           (article.lineage && article.lineage.toLowerCase().includes(lowerQ)) ||
           (article.futureSpeak && article.futureSpeak.toLowerCase().includes(lowerQ))
         );
       });
    }

    return false;
  });
};
