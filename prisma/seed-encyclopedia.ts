import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const API = 'https://wsearch.nlm.nih.gov/ws/query';
const TARGET = 500;
const RETMAX = 50;
const DELAY_MS = 800;

const TERMS = [
  'first aid', 'emergency', 'injury', 'wound', 'burn', 'fracture', 'bleeding',
  'poisoning', 'choking', 'shock', 'concussion',
  'infection', 'bacteria', 'virus', 'fever', 'malaria', 'hepatitis', 'typhoid',
  'heart', 'lung', 'brain', 'liver', 'kidney', 'skin', 'eye', 'ear', 'bone',
  'blood', 'muscle', 'digestive', 'respiratory', 'immune', 'joint',
  'diabetes', 'cancer', 'allergy', 'asthma', 'arthritis', 'hypertension',
  'stroke', 'headache', 'pain', 'anxiety', 'depression', 'obesity',
  'nausea', 'dizziness', 'fatigue', 'rash', 'swelling', 'seizure', 'cough',
  'heat illness', 'altitude', 'cold', 'food', 'insect', 'bite',
  'nutrition', 'sleep', 'pregnancy', 'child', 'surgery', 'vaccine',
  'dental', 'spine', 'nerve', 'stomach', 'thyroid', 'hormones',
];

interface Topic {
  url: string;
  title: string;
  altTitles: string[];
  summary: string;
  fullSummary: string;
  categories: string[];
  meshTerms: string[];
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function clean(raw: string): string {
  return stripHtml(decodeXml(raw));
}

function getFields(body: string, name: string): string[] {
  const re = new RegExp(`<content name="${name}">([\s\S]*?)<\\/content>`, 'g');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) out.push(m[1]);
  return out;
}

function parseXml(xml: string): Topic[] {
  const docRe = /<document rank="\d+" url="([^"]+)">([\s\S]*?)<\/document>/g;
  const topics: Topic[] = [];
  let m: RegExpExecArray | null;
  while ((m = docRe.exec(xml)) !== null) {
    const [, url, body] = m;
    const title = clean(getFields(body, 'title')[0] ?? '');
    if (!title) continue;
    topics.push({
      url,
      title,
      altTitles: getFields(body, 'altTitle').map(clean).filter(Boolean),
      fullSummary: clean(getFields(body, 'FullSummary')[0] ?? ''),
      summary: clean(getFields(body, 'snippet')[0] ?? ''),
      categories: getFields(body, 'groupName').map(clean).filter(Boolean),
      meshTerms: getFields(body, 'mesh').map(clean).filter(Boolean),
    });
  }
  return topics;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchTopics(term: string): Promise<Topic[]> {
  const { data } = await axios.get<string>(API, {
    params: { db: 'healthTopics', term, retmax: RETMAX },
    responseType: 'text',
    timeout: 15000,
  });
  return parseXml(data);
}

async function main() {
  const existing = await prisma.healthTopic.count();
  if (existing > 0) {
    console.log(`이미 ${existing}개 존재. 스킵합니다.`);
    return;
  }

  const seen = new Set<string>();
  const collected: Topic[] = [];

  for (const term of TERMS) {
    if (collected.length >= TARGET) break;
    try {
      process.stdout.write(`[${collected.length}/${TARGET}] "${term}" 검색 중...\r`);
      const topics = await fetchTopics(term);
      for (const t of topics) {
        if (seen.has(t.url)) continue;
        seen.add(t.url);
        collected.push(t);
        if (collected.length >= TARGET) break;
      }
    } catch (e) {
      console.error(`\n"${term}" 실패: ${(e as Error).message}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n총 ${collected.length}개 DB에 저장 중...`);
  await prisma.healthTopic.createMany({
    data: collected.map((t) => ({
      title: t.title,
      altTitles: JSON.stringify(t.altTitles),
      summary: t.summary,
      fullSummary: t.fullSummary,
      categories: JSON.stringify(t.categories),
      meshTerms: JSON.stringify(t.meshTerms),
      url: t.url,
    })),
    skipDuplicates: true,
  });
  console.log(`완료: ${collected.length}개 저장됨`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
