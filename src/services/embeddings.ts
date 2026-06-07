import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any = null;

async function getPipeline() {
  if (!embeddingPipeline) {
    console.log('Loading embedding model...');
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded.');
  }
  return embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getPipeline();
  const output = await pipe(text.substring(0, 512), { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

// Warm up on startup (non-blocking)
getPipeline().catch(err => console.error('Failed to preload embedding model:', err));
