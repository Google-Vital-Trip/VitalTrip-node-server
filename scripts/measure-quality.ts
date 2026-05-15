/**
 * RAG 도입 전/후 응답 품질 비교 스크립트
 *
 * 방법: GPT-4o-mini를 심판으로 사용해 블라인드 채점 (LLM-as-Judge)
 * 평가 기준: 의학 정확도 / 단계별 완결성 / 즉각 실행 가능성 (각 1-10점)
 *
 * 실행: pnpm measure:quality
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

interface VectorDocument {
  id: string;
  symptomType: string;
  text: string;
  vector: number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function search(docs: VectorDocument[], queryVec: number[], topK = 2): VectorDocument[] {
  return docs
    .map((doc) => ({ doc, score: cosineSimilarity(queryVec, doc.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ doc }) => doc);
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── 시스템 프롬프트 (openai.service.ts와 동일) ──────────────────────────────

const BASE_SYSTEM_PROMPT = `You are an emergency medical expert providing first-aid guidance for travelers.
Respond ONLY with a JSON object:
{
  "content": "exactly 9-10 first-aid steps separated by \\n, no numbers or bullets",
  "summary": "1-2 sentence overview",
  "recommendedAction": "single most urgent action right now",
  "disclaimer": "AI advice only — not professional diagnosis; seek immediate professional care; call emergency services",
  "confidence": <integer 0-100>,
  "blogLinks": ["trusted medical URL 1", "trusted medical URL 2", "trusted medical URL 3"]
}`;

const JUDGE_PROMPT = `You are an expert medical reviewer evaluating first-aid guidance quality.
Score the response on three criteria (each 1-10):
- medicalAccuracy: Is the advice medically correct and safe?
- completeness: Are all critical steps covered, nothing important missing?
- actionability: Can a non-medical person immediately follow these steps?

Respond ONLY with JSON: { "medicalAccuracy": <1-10>, "completeness": <1-10>, "actionability": <1-10> }`;

// ─── 테스트 케이스 ────────────────────────────────────────────────────────────

const TEST_CASES = [
  {
    symptomType: 'BLEEDING',
    query: 'BLEEDING severe cut on wrist with heavy blood loss, cannot stop bleeding',
    detail: '오른쪽 손목에서 출혈이 심하게 발생하고 있습니다. 수건으로 눌러도 피가 멈추지 않습니다.',
  },
  {
    symptomType: 'BURNS',
    query: 'BURNS hot boiling water spilled on forearm large area blistering',
    detail: '끓는 물이 팔뚝에 쏟아졌습니다. 넓은 범위에 물집이 생기고 있습니다.',
  },
  {
    symptomType: 'ALLERGIC_REACTION',
    query: 'ALLERGIC_REACTION face and throat swelling after eating seafood difficulty breathing',
    detail: '해산물을 먹은 후 얼굴과 목이 부어오르고 숨쉬기가 어렵습니다.',
  },
  {
    symptomType: 'HEATSTROKE',
    query: 'HEATSTROKE person collapsed in heat confusion high body temperature not sweating',
    detail: '더운 날씨에 쓰러졌습니다. 의식이 흐리고 체온이 매우 높으며 땀이 나지 않습니다.',
  },
];

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

  const vectorsPath = path.resolve(__dirname, '../src/first-aid/knowledge-base/vectors.json');
  const documents: VectorDocument[] = JSON.parse(fs.readFileSync(vectorsPath, 'utf-8'));
  const client = new OpenAI({ apiKey });

  console.log('='.repeat(60));
  console.log('RAG 도입 전/후 응답 품질 비교 (LLM-as-Judge)');
  console.log('='.repeat(60));
  console.log(`테스트 케이스: ${TEST_CASES.length}개 | 심판 모델: gpt-4o-mini\n`);

  const withRagScores: number[] = [];
  const withoutRagScores: number[] = [];

  for (const tc of TEST_CASES) {
    console.log(`\n▶ ${tc.symptomType}`);

    // 1. RAG 컨텍스트 검색
    const embedRes = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: tc.query,
    });
    const queryVec = embedRes.data[0].embedding;
    const docs = search(documents, queryVec, 2);
    const ragContext = docs.map((d) => `[${d.symptomType}]\n${d.text}`).join('\n\n---\n\n');

    const userMessage = [
      `responseLanguage: Korean`,
      `symptomType: ${tc.symptomType}`,
      `symptomDetail: ${tc.detail}`,
      `countryCode: KR`,
    ].join('\n');

    // 2. RAG 없이 GPT 호출
    const [withoutRagRes, withRagRes] = await Promise.all([
      client.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: BASE_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
      }),
      // 3. RAG 있이 GPT 호출
      client.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `${BASE_SYSTEM_PROMPT}\n\n## RETRIEVED FIRST-AID REFERENCE\nUse the following verified medical guidelines as your primary source:\n\n${ragContext}`,
          },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
      }),
    ]);

    const withoutRagContent = withoutRagRes.choices[0].message.content ?? '{}';
    const withRagContent = withRagRes.choices[0].message.content ?? '{}';

    // 4. 심판 채점 (블라인드 — A/B 중 어느 쪽이 RAG인지 모름)
    const [judgeA, judgeB] = await Promise.all([
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: JUDGE_PROMPT },
          {
            role: 'user',
            content: `Symptom: ${tc.symptomType}\n\nFirst-aid response to evaluate:\n${withoutRagContent}`,
          },
        ],
        temperature: 0,
      }),
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: JUDGE_PROMPT },
          {
            role: 'user',
            content: `Symptom: ${tc.symptomType}\n\nFirst-aid response to evaluate:\n${withRagContent}`,
          },
        ],
        temperature: 0,
      }),
    ]);

    const scoreA = JSON.parse(judgeA.choices[0].message.content ?? '{}') as Record<string, number>;
    const scoreB = JSON.parse(judgeB.choices[0].message.content ?? '{}') as Record<string, number>;

    const totalA = mean(Object.values(scoreA));
    const totalB = mean(Object.values(scoreB));

    withoutRagScores.push(totalA);
    withRagScores.push(totalB);

    console.log(`  RAG 없음: 의학정확도 ${scoreA.medicalAccuracy} / 완결성 ${scoreA.completeness} / 실행가능 ${scoreA.actionability} → 평균 ${totalA.toFixed(2)}`);
    console.log(`  RAG 있음: 의학정확도 ${scoreB.medicalAccuracy} / 완결성 ${scoreB.completeness} / 실행가능 ${scoreB.actionability} → 평균 ${totalB.toFixed(2)}`);
  }

  const avgWithout = mean(withoutRagScores);
  const avgWith = mean(withRagScores);
  const improvement = ((avgWith - avgWithout) / avgWithout) * 100;

  console.log('\n' + '='.repeat(60));
  console.log('최종 결과');
  console.log('='.repeat(60));
  console.log(`RAG 없음 평균 점수: ${avgWithout.toFixed(2)} / 10`);
  console.log(`RAG 있음 평균 점수: ${avgWith.toFixed(2)} / 10`);
  console.log(`품질 개선율: +${improvement.toFixed(1)}%`);
  console.log('='.repeat(60));
  console.log('\n이력서 문장 예시:');
  console.log(`"RAG 도입 후 LLM-as-Judge 평가에서 응답 품질 ${improvement.toFixed(0)}% 향상"`);
  console.log(`"(RAG 없음 ${avgWithout.toFixed(1)}점 → RAG 있음 ${avgWith.toFixed(1)}점 / 10점 만점)"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
