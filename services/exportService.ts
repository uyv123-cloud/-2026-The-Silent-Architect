import { DailyIssue } from "../types";

/**
 * Downloads the daily issue as a JSON file.
 * The data is formatted specifically for easy ingestion into RAG systems (Vector DBs).
 */
export const downloadRagDataset = (issue: DailyIssue) => {
  try {
    // 1. Flatten the data for RAG
    const ragChunks = issue.articles.map((article) => ({
      date: issue.date,
      theme: `${issue.theme} (${issue.themeSub})`,
      category: article.categoryName,
      focus_sentence: article.focusSentence,
      content_body: article.body,
      source_link: article.link,
      historical_context: article.lineage || "",
      future_prediction: article.futureSpeak || "",
      keywords: issue.intro.keywords,
      global_trend_vector: issue.intro.vector
    }));

    // 2. Convert to JSON string
    const jsonString = JSON.stringify(ragChunks, null, 2);

    // 3. Create a Blob
    const blob = new Blob([jsonString], { type: "application/json" });
    
    // 4. Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeDate = issue.date.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `TSA_Dataset_${safeDate}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
};

/**
 * Generates and downloads a structured Text file optimized for Google NotebookLM.
 * NotebookLM handles Markdown/Text files very well for "Source" ingestion.
 * This structure explicitly separates sections to help the AI understand the hierarchy.
 */
export const downloadNotebookLMSource = (issue: DailyIssue) => {
  try {
    const lines = [];

    // --- HEADER METADATA ---
    lines.push(`Title: The Silent Architect Daily Brief - ${issue.date}`);
    lines.push(`Date: ${issue.date}`);
    lines.push(`Theme: ${issue.theme}`);
    lines.push(`Sub-Theme: ${issue.themeSub}`);
    lines.push(`Keywords: ${issue.intro.keywords}`);
    lines.push(`Trend Vector: ${issue.intro.vector}`);
    lines.push(`Philosophical Reflection: ${issue.intro.reflection}`);
    lines.push(`\n---\n`);

    // --- EXECUTIVE SUMMARY ---
    lines.push(`## EXECUTIVE SUMMARY`);
    lines.push(`This document contains 6 curated architectural insights generated on ${issue.date}.`);
    lines.push(`The central intersection of these ideas is: ${issue.intro.intersection}`);
    lines.push(`\n---\n`);

    // --- ARTICLES (Structured for AI Analysis) ---
    issue.articles.forEach((article, index) => {
      lines.push(`## INSIGHT ${index + 1}: ${article.categoryName}`);
      lines.push(`### Core Concept`);
      lines.push(article.focusSentence);
      
      lines.push(`### Analysis`);
      lines.push(article.body);
      
      if (article.lineage) {
        lines.push(`### Historical Context (Lineage)`);
        lines.push(article.lineage);
      }
      
      if (article.futureSpeak) {
        lines.push(`### Future Implication (Vector)`);
        lines.push(article.futureSpeak);
      }

      lines.push(`### Source Link`);
      lines.push(article.link);
      
      lines.push(`\n---\n`);
    });

    // --- FINAL THOUGHT ---
    lines.push(`## FINAL PROMPT`);
    lines.push(issue.finalPrompt);

    const textContent = lines.join('\n');
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeDate = issue.date.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `TSA_NotebookLM_Source_${safeDate}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("NotebookLM Export failed:", error);
    return false;
  }
}