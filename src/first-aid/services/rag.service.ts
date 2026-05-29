import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { VectorStoreService } from './vector-store.service.js';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly client: OpenAI;

  constructor(
    private readonly config: ConfigService,
    private readonly vectorStore: VectorStoreService,
  ) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async findRelevantDocuments(query: string, topK = 2): Promise<string> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });
      const queryVector = response.data[0].embedding;
      const docs = await this.vectorStore.search(queryVector, topK);

      if (docs.length === 0) return '';

      return docs
        .map((doc) => `[${doc.symptomType}]\n${doc.text}`)
        .join('\n\n---\n\n');
    } catch (error) {
      this.logger.error(`RAG retrieval failed: ${(error as Error).message}`);
      return '';
    }
  }
}
