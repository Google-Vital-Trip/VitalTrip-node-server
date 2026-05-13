import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface VectorDocument {
  id: string;
  symptomType: string;
  text: string;
  vector: number[];
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private documents: VectorDocument[] = [];

  private get vectorsPath(): string {
    return path.resolve(process.cwd(), 'src/first-aid/knowledge-base/vectors.json');
  }

  onModuleInit() {
    if (!fs.existsSync(this.vectorsPath)) {
      this.logger.warn('vectors.json not found. Run "pnpm seed:vectors" to generate.');
      return;
    }
    const raw = fs.readFileSync(this.vectorsPath, 'utf-8');
    this.documents = JSON.parse(raw) as VectorDocument[];
    this.logger.log(`Loaded ${this.documents.length} documents into vector store`);
  }

  search(queryVector: number[], topK = 3): VectorDocument[] {
    if (this.documents.length === 0) return [];

    return this.documents
      .map((doc) => ({ doc, score: this.cosineSimilarity(queryVector, doc.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ doc }) => doc);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}
