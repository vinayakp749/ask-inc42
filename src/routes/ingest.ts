import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generateEmbedding } from '../services/embeddings';
import { insertArticle, articleExists } from '../services/supabase';

const router = Router();

const ingestSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url(),
  content: z.string().min(1),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published_at: z.string().optional(),
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ingestSchema.parse(req.body);
    const exists = await articleExists(data.url);
    if (exists) return res.status(409).json({ error: 'Article already exists', url: data.url });
    const text = `${data.title}\n\n${data.summary || ''}\n\n${data.content}`;
    const embedding = await generateEmbedding(text);
    const article = await insertArticle({ ...data, embedding });
    res.status(201).json({ success: true, id: article.id, title: article.title });
  } catch (err) { next(err); }
});

export default router;
