import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { generateEmbedding } from '../services/embeddings';
import { searchArticles } from '../services/supabase';
import { generateAnswer } from '../services/groq';

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
    const embedding = await generateEmbedding(question);
    const sources = await searchArticles(embedding, question, 5);
    const answer = await generateAnswer(question, sources, history);
    res.json({
      answer,
      sources: sources.map(s => ({ id: s.id, title: s.title, url: s.url })),
      conversation_id: conversation_id || uuidv4(),
    });
  } catch (err) { next(err); }
});

export default router;
