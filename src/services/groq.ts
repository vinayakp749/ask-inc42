import Groq from 'groq-sdk';
import { config } from '../config';
import { ChatMessage, SearchResult } from '../types';

const groq = new Groq({ apiKey: config.groq.apiKey });

export async function generateAnswer(
  question: string,
  sources: SearchResult[],
  history: ChatMessage[] = []
): Promise<string> {
  const context = sources.length > 0
    ? sources.map((s, i) => `[${i+1}] ${s.title}\nURL: ${s.url}\n${s.content.substring(0,600)}`).join('\n\n')
    : 'No specific articles found. Answer from general knowledge about the Indian startup ecosystem.';

  const systemPrompt = `You are AskInc42, an AI assistant for the Indian startup ecosystem using Inc42 news and data.

Context:
${context}

Guidelines: be concise, cite sources [1][2], focus on Indian startups/funding/founders/tech trends.`;

  const completion = await groq.chat.completions.create({
    model: config.groq.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role as 'user'|'assistant', content: m.content })),
      { role: 'user', content: question },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });
  return completion.choices[0]?.message?.content || 'Unable to generate a response.';
}
