import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ask-inc42', timestamp: new Date().toISOString() });
});

app.use('/api/v1', routes);
app.use(errorHandler as any);

app.listen(config.port, () => {
  console.log(`[ask-inc42] API listening on port ${config.port} (${config.nodeEnv})`);
});

export default app;
