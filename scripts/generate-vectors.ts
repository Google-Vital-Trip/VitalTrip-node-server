import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const DOCS_DIR = path.resolve(__dirname, '../src/first-aid/knowledge-base/documents');
const OUTPUT_PATH = path.resolve(__dirname, '../src/first-aid/knowledge-base/vectors.json');

const SYMPTOM_TYPE_MAP: Record<string, string> = {
  'bleeding': 'BLEEDING',
  'burns': 'BURNS',
  'fracture': 'FRACTURE',
  'allergic-reaction': 'ALLERGIC_REACTION',
  'seizure': 'SEIZURE',
  'heatstroke': 'HEATSTROKE',
  'hypothermia': 'HYPOTHERMIA',
  'poisoning': 'POISONING',
  'breathing-difficulty': 'BREATHING_DIFFICULTY',
  'animal-bite': 'ANIMAL_BITE',
  'fall-injury': 'FALL_INJURY',
};

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set in .env');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));
  const results = [];

  console.log(`Found ${files.length} documents. Generating embeddings...\n`);

  for (const file of files) {
    const id = file.replace('.md', '');
    const symptomType = SYMPTOM_TYPE_MAP[id];

    if (!symptomType) {
      console.warn(`No symptomType mapping for "${file}" — skipping`);
      continue;
    }

    const text = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    results.push({
      id,
      symptomType,
      text,
      vector: response.data[0].embedding,
    });

    console.log(`✓ ${id} (${symptomType})`);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nSaved ${results.length} vectors to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
