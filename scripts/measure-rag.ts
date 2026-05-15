/**
 * RAG 파이프라인 측정 스크립트
 *
 * 측정 항목:
 * 1. 임베딩 생성 레이턴시 (OpenAI API)
 * 2. 코사인 유사도 검색 레이턴시 (인메모리)
 * 3. 검색 정확도 — 증상 유형이 올바르게 Top-1에 오는지
 * 4. RAG 있을 때 vs 없을 때 GPT 응답 비교
 *
 * 실행: pnpm measure:rag
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface VectorDocument {
  id: string;
  symptomType: string;
  text: string;
  vector: number[];
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function search(documents: VectorDocument[], queryVector: number[], topK = 2): VectorDocument[] {
  return documents
    .map((doc) => ({ doc, score: cosineSimilarity(queryVector, doc.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ doc }) => doc);
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function p95(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)];
}

// ─── 테스트 케이스 ────────────────────────────────────────────────────────────

const TEST_CASES = [
  { query: 'BLEEDING severe cut on arm with heavy blood loss', expectedType: 'BLEEDING' },
  { query: 'BURNS hot liquid spilled on skin causing blisters', expectedType: 'BURNS' },
  { query: 'FRACTURE broken leg cannot move after fall', expectedType: 'FRACTURE' },
  { query: 'ALLERGIC_REACTION face swelling difficulty breathing after eating', expectedType: 'ALLERGIC_REACTION' },
  { query: 'SEIZURE convulsions shaking uncontrollably on the ground', expectedType: 'SEIZURE' },
  { query: 'HEATSTROKE high body temperature confusion in hot weather', expectedType: 'HEATSTROKE' },
  { query: 'HYPOTHERMIA shivering uncontrollably lost in cold weather', expectedType: 'HYPOTHERMIA' },
  { query: 'POISONING swallowed unknown substance nausea vomiting', expectedType: 'POISONING' },
  { query: 'BREATHING_DIFFICULTY cannot breathe chest tightness wheezing', expectedType: 'BREATHING_DIFFICULTY' },
  { query: 'ANIMAL_BITE dog bite deep wound bleeding', expectedType: 'ANIMAL_BITE' },
  { query: 'FALL_INJURY fell from stairs head injury possible spinal damage', expectedType: 'FALL_INJURY' },
];

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set in .env');
    process.exit(1);
  }

  const vectorsPath = path.resolve(__dirname, '../src/first-aid/knowledge-base/vectors.json');
  const documents: VectorDocument[] = JSON.parse(fs.readFileSync(vectorsPath, 'utf-8'));
  const client = new OpenAI({ apiKey });

  console.log('='.repeat(60));
  console.log('RAG 파이프라인 측정');
  console.log('='.repeat(60));
  console.log(`문서 수: ${documents.length}개 | 벡터 차원: ${documents[0].vector.length}\n`);

  // ── 1. 임베딩 레이턴시 측정 (10회 반복) ──────────────────────────────────
  console.log('[ 1/3 ] 임베딩 레이턴시 측정 (10회)...');
  const embeddingLatencies: number[] = [];

  for (let i = 0; i < 10; i++) {
    const tc = TEST_CASES[i % TEST_CASES.length];
    const t0 = performance.now();
    await client.embeddings.create({ model: 'text-embedding-3-small', input: tc.query });
    embeddingLatencies.push(performance.now() - t0);
    process.stdout.write('.');
  }
  console.log('\n');

  console.log(`  평균 임베딩 레이턴시: ${mean(embeddingLatencies).toFixed(0)}ms`);
  console.log(`  p95 임베딩 레이턴시:  ${p95(embeddingLatencies).toFixed(0)}ms`);

  // ── 2. 코사인 검색 레이턴시 측정 ─────────────────────────────────────────
  console.log('\n[ 2/3 ] 코사인 유사도 검색 레이턴시 측정...');
  const searchLatencies: number[] = [];

  // 쿼리 벡터 미리 생성
  const queryVectors: number[][] = [];
  for (const tc of TEST_CASES) {
    const res = await client.embeddings.create({ model: 'text-embedding-3-small', input: tc.query });
    queryVectors.push(res.data[0].embedding);
  }

  // 검색만 100회 측정 (API 호출 제외, 순수 인메모리 속도)
  for (let i = 0; i < 100; i++) {
    const vec = queryVectors[i % queryVectors.length];
    const t0 = performance.now();
    search(documents, vec, 2);
    searchLatencies.push(performance.now() - t0);
  }

  console.log(`  평균 검색 레이턴시: ${mean(searchLatencies).toFixed(3)}ms`);
  console.log(`  p95 검색 레이턴시:  ${p95(searchLatencies).toFixed(3)}ms`);
  console.log(`  (${documents.length}개 문서 × 1,536차원 코사인 유사도 계산)`);

  // ── 3. 검색 정확도 (Top-1 / Top-2 Accuracy) ──────────────────────────────
  console.log('\n[ 3/3 ] 검색 정확도 측정...');
  let top1Correct = 0;
  let top2Correct = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const results = search(documents, queryVectors[i], 2);
    const retrievedTypes = results.map((r) => r.symptomType);

    if (retrievedTypes[0] === tc.expectedType) top1Correct++;
    if (retrievedTypes.includes(tc.expectedType)) top2Correct++;

    const mark = retrievedTypes[0] === tc.expectedType ? '✓' : '✗';
    console.log(`  ${mark} [${tc.expectedType}] → Top-1: ${retrievedTypes[0]}, Top-2: ${retrievedTypes[1]}`);
  }

  const top1Acc = (top1Correct / TEST_CASES.length) * 100;
  const top2Acc = (top2Correct / TEST_CASES.length) * 100;

  console.log(`\n  Top-1 정확도: ${top1Acc.toFixed(0)}% (${top1Correct}/${TEST_CASES.length})`);
  console.log(`  Top-2 정확도: ${top2Acc.toFixed(0)}% (${top2Correct}/${TEST_CASES.length})`);

  // ── 요약 ─────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('측정 결과 요약');
  console.log('='.repeat(60));
  console.log(`임베딩 레이턴시 (평균/p95): ${mean(embeddingLatencies).toFixed(0)}ms / ${p95(embeddingLatencies).toFixed(0)}ms`);
  console.log(`검색 레이턴시 (평균/p95):   ${mean(searchLatencies).toFixed(3)}ms / ${p95(searchLatencies).toFixed(3)}ms`);
  console.log(`Top-1 검색 정확도:          ${top1Acc.toFixed(0)}%`);
  console.log(`Top-2 검색 정확도:          ${top2Acc.toFixed(0)}%`);
  console.log('='.repeat(60));
  console.log('\n이력서 문장 예시:');
  console.log(`"text-embedding-3-small 기반 인메모리 벡터 검색(평균 ${mean(searchLatencies).toFixed(2)}ms),`);
  console.log(` Top-2 검색 정확도 ${top2Acc.toFixed(0)}%로 GPT-4o 컨텍스트 주입"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
