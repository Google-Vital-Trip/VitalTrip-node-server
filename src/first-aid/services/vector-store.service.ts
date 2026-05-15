import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorDocument {
  id: string;
  symptomType: string;
  text: string;
}

const COLLECTION_NAME = 'first_aid';
const VECTOR_SIZE = 1536;

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  readonly client: QdrantClient;

  constructor(private readonly config: ConfigService) {
    this.client = new QdrantClient({
      url: this.config.get<string>('QDRANT_URL', 'http://localhost:6333'),
    });
  }

  async onModuleInit() {
    try {
      const { collections } = await this.client.getCollections();
      const exists = collections.some((c) => c.name === COLLECTION_NAME);

      if (!exists) {
        await this.client.createCollection(COLLECTION_NAME, {
          vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
        });
        this.logger.warn(`Collection "${COLLECTION_NAME}" created. Run "pnpm seed:vectors" to populate.`);
      } else {
        const info = await this.client.getCollection(COLLECTION_NAME);
        this.logger.log(`Qdrant connected — "${COLLECTION_NAME}" (${info.points_count} points)`);
      }
    } catch (error) {
      this.logger.error(`Failed to connect to Qdrant: ${(error as Error).message}`);
    }
  }

  async search(queryVector: number[], topK = 3): Promise<VectorDocument[]> {
    const results = await this.client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: topK,
      with_payload: true,
    });

    return results.map((r) => r.payload as unknown as VectorDocument);
  }
}
