import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const API = 'https://wsearch.nlm.nih.gov/ws/query';
const RETMAX = 500;
const DELAY_MS = 1000;

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
  const re = new RegExp(`<content name="${name}">([\\s\\S]*?)<\\/content>`, 'g');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) out.push(m[1]);
  return out;
}

function getTotalCount(xml: string): number {
  const m = /<count>(\d+)<\/count>/.exec(xml);
  return m ? parseInt(m[1], 10) : 0;
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

async function fetchPage(retstart: number): Promise<{ total: number; topics: Topic[] }> {
  const { data } = await axios.get<string>(API, {
    params: { db: 'healthTopics', term: 'a', retmax: RETMAX, retstart },
    responseType: 'text',
    timeout: 30000,
  });
  return { total: getTotalCount(data), topics: parseXml(data) };
}

async function main() {
  const existing = await prisma.healthTopic.count();
  if (existing > 0) {
    console.log(`이미 ${existing}개 존재. 스킵합니다.`);
    return;
  }

  const seen = new Set<string>();
  const collected: Topic[] = [];

  console.log('첫 번째 페이지 요청 중...');
  const first = await fetchPage(0);
  const total = first.total;
  console.log(`전체 health topic 수: ${total}개`);

  for (const t of first.topics) {
    if (!seen.has(t.url)) {
      seen.add(t.url);
      collected.push(t);
    }
  }
  console.log(`[${collected.length}/${total}] 수집 완료`);

  let retstart = RETMAX;
  while (retstart < total) {
    await sleep(DELAY_MS);
    console.log(`페이지 요청 중... (retstart=${retstart})`);
    const page = await fetchPage(retstart);
    for (const t of page.topics) {
      if (!seen.has(t.url)) {
        seen.add(t.url);
        collected.push(t);
      }
    }
    retstart += RETMAX;
    console.log(`[${collected.length}/${total}] 수집 완료`);
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
