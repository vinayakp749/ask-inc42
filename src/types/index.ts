export interface Article {
  id: string; title: string; url: string; content: string;
  summary?: string; tags?: string[]; published_at?: string;
  embedding?: number[]; created_at: string;
}
export interface ChatMessage { role: 'user' | 'assistant'; content: string; }
export interface ChatRequest { question: string; conversation_id?: string; history?: ChatMessage[]; }
export interface ChatResponse { answer: string; sources: Pick<Article,'id'|'title'|'url'>[]; conversation_id: string; }
export interface IngestRequest { title: string; url: string; content: string; summary?: string; tags?: string[]; published_at?: string; }
export interface SearchResult { id: string; title: string; url: string; content: string; similarity: number; }
