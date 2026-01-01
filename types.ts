
export enum ContentMode {
  DeepBrief = 'Deep Brief',
  DailyDigest = 'Daily Digest'
}

export enum ViewMode {
  Reader = 'Reader',
  Archive = 'Archive'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Article {
  id: string;
  categoryCode: string;
  categoryName: string;
  focusSentence: string;
  body: string;
  link: string;
  lineage?: string;
  futureSpeak?: string;
}

export interface FourfoldIntro {
  keywords: string;
  intersection: string;
  vector: string;
  reflection: string;
}

export interface DailyIssue {
  date: string;
  theme: string;
  themeSub: string;
  intro: FourfoldIntro;
  articles: Article[];
  finalPrompt: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';
