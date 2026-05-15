import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';

dotenv.config();

const DOCS_DIR = path.resolve(__dirname, '../src/first-aid/knowledge-base/documents');
const COLLECTION_NAME = 'first_aid';
const VECTOR_SIZE = 1536;

const SYMPTOM_TYPE_MAP: Record<string, string> = {
  'bleeding-mild': 'BLEEDING',
  'bleeding-severe': 'BLEEDING',
  'bleeding-special': 'BLEEDING',
  'burns-mild': 'BURNS',
  'burns-severe': 'BURNS',
  'burns-special': 'BURNS',
  'fracture-mild': 'FRACTURE',
  'fracture-severe': 'FRACTURE',
  'fracture-special': 'FRACTURE',
  'allergic-reaction-mild': 'ALLERGIC_REACTION',
  'allergic-reaction-severe': 'ALLERGIC_REACTION',
  'allergic-reaction-special': 'ALLERGIC_REACTION',
  'seizure-mild': 'SEIZURE',
  'seizure-severe': 'SEIZURE',
  'seizure-special': 'SEIZURE',
  'heatstroke-mild': 'HEATSTROKE',
  'heatstroke-severe': 'HEATSTROKE',
  'heatstroke-special': 'HEATSTROKE',
  'hypothermia-mild': 'HYPOTHERMIA',
  'hypothermia-severe': 'HYPOTHERMIA',
  'hypothermia-special': 'HYPOTHERMIA',
  'poisoning-mild': 'POISONING',
  'poisoning-severe': 'POISONING',
  'poisoning-special': 'POISONING',
  'breathing-difficulty-mild': 'BREATHING_DIFFICULTY',
  'breathing-difficulty-severe': 'BREATHING_DIFFICULTY',
  'breathing-difficulty-special': 'BREATHING_DIFFICULTY',
  'animal-bite-mild': 'ANIMAL_BITE',
  'animal-bite-severe': 'ANIMAL_BITE',
  'animal-bite-special': 'ANIMAL_BITE',
  'fall-injury-mild': 'FALL_INJURY',
  'fall-injury-severe': 'FALL_INJURY',
  'fall-injury-special': 'FALL_INJURY',
  'ilcor-first-aid-costr': 'GENERAL',
  'who-icrc-basic-emergency-care': 'GENERAL',
  'ifrc-2025-guidelines': 'GENERAL',
};

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set in .env');
    process.exit(1);
  }

  const qdrantUrl = process.env.QDRANT_URL ?? 'http://localhost:6333';
  const openai = new OpenAI({ apiKey });
  const qdrant = new QdrantClient({ url: qdrantUrl });

  const { collections } = await qdrant.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION_NAME);
  if (exists) {
    await qdrant.deleteCollection(COLLECTION_NAME);
    console.log(`Dropped existing collection "${COLLECTION_NAME}"`);
  }
  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
  });
  console.log(`Created collection "${COLLECTION_NAME}"\n`);

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));
  console.log(`Found ${files.length} documents. Generating embeddings...\n`);

  const points: { id: number; vector: number[]; payload: Record<string, string> }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const id = file.replace('.md', '');
    const symptomType = SYMPTOM_TYPE_MAP[id];

    if (!symptomType) {
      console.warn(`No symptomType mapping for "${file}" — skipping`);
      continue;
    }

    const text = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    points.push({
      id: i,
      vector: response.data[0].embedding,
      payload: { id, symptomType, text },
    });

    console.log(`✓ ${id} (${symptomType})`);
  }

  await qdrant.upsert(COLLECTION_NAME, { points });
  console.log(`\nUpserted ${points.length} vectors to Qdrant (${qdrantUrl})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
