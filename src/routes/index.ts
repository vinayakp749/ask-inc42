import { Router } from 'express';
import chatRouter from './chat';
import ingestRouter from './ingest';

const router = Router();
router.use('/ask', chatRouter);
router.use('/ingest', ingestRouter);
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ask-inc42', timestamp: new Date().toISOString() });
});
export default router;
