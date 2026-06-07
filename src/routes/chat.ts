import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { searchInc42 } from '../services/scraper';
import { generateAnswer } from '../services/groq';
import { ChatMessage } from '../types';

const router = Router();

const chatSchema = z.object({
  question: z.string().min(1).max(1000),
  conversation_id: z.string().uuid().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, conversation_id, history } = chatSchema.parse(req.body);

    // Real-time scrape Inc42 for relevant articles
    const articles = await searchInc42(question);

    // Build context string from scraped articles
    const context = articles.length > 0
      ? articles.map((a, i) => `[${i + 1}] ${a.title}\nURL: ${a.url}\n${a.content}`).join('\n\n---\n\n')
      : '';

    const answer = await generateAnswer(question, context, history as ChatMessage[]);

    res.json({
      answer,
      sources: articles.map(a => ({ title: a.title, url: a.url, summary: a.summary })),
      conversation_id: conversation_id || uuidv4(),
      articlesFound: articles.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
