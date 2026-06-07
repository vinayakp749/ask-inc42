import Groq from 'groq-sdk';
import { config } from '../config';
import { ChatMessage } from '../types';

const groq = new Groq({ apiKey: config.groq.apiKey });

export async function generateAnswer(
  question: string,
  context: string,
  history: ChatMessage[] = []
): Promise<string> {
  const contextBlock = context.length > 0
    ? `Real-time articles scraped from Inc42:\n\n${context}`
    : 'No Inc42 articles found for this query. Answer from general knowledge about the Indian startup ecosystem.';

  const systemPrompt = `You are AskInc42, an AI assistant specialised in the Indian startup ecosystem. You answer questions using live data scraped in real-time from Inc42.

${contextBlock}

Guidelines:
- Be concise and factual
- Cite sources by number [1], [2] when referencing specific articles
- Focus on Indian startups, funding rounds, founders, and tech trends
- If context is insufficient, say so and answer from general knowledge`;

  const messages = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: question },
  ];

  const completion = await groq.chat.completions.create({
    model: config.groq.model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 1024,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || 'Unable to generate a response.';
}
