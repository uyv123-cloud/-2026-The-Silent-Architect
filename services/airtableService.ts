import { DailyIssue } from "../types";

/**
 * Saves the generated daily issue to Airtable.
 * This structure is optimized for RAG (Retrieval-Augmented Generation).
 * Instead of saving one big JSON blob, we save individual "Knowledge Chunks" (Articles).
 * 
 * Airtable Table Schema (Recommended):
 * - Date (Date)
 * - Category (Single Line Text)
 * - FocusSentence (Long Text) -> Acts as the "Title" or "Question"
 * - Body (Long Text) -> The main content chunk for RAG embedding
 * - Link (URL)
 * - Keywords (Long Text) -> Context metadata
 * - Theme (Single Line Text) -> Context metadata
 * - FutureSpeak (Long Text)
 */
export const saveToAirtable = async (issue: DailyIssue): Promise<boolean> => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'KnowledgeBase';

  if (!apiKey || !baseId) {
    console.error("Airtable configuration missing (API Key or Base ID)");
    return false;
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

  // Transform the DailyIssue into an array of records (one per article)
  // This flattens the data, making it better for vector search later.
  const records = issue.articles.map((article) => {
    return {
      fields: {
        "Date": issue.date,
        "Category": article.categoryName,
        "FocusSentence": article.focusSentence,
        "Body": article.body,
        "Link": article.link,
        "Keywords": issue.intro.keywords, // Attach global context to local chunk
        "Theme": issue.theme,
        "ThemeSub": issue.themeSub,
        "FutureSpeak": article.futureSpeak || "",
        "Lineage": article.lineage || ""
      }
    };
  });

  // Airtable API allows creating up to 10 records per request.
  // Since we usually have 5-6 articles, one batch is sufficient.
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Airtable Error:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Network Error saving to Airtable:", error);
    return false;
  }
};