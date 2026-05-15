import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface EncyclopediaItem {
  id: string;
  name: string;
  icdCodes: string[];
}

// NIH API: [total, codes[], extraFields | null, rows[][]]
type NihResponse = [number, string[], Record<string, (string[] | null)[]> | null, string[][]];

@Injectable()
export class EncyclopediaService {
  private readonly logger = new Logger(EncyclopediaService.name);
  private readonly NIH_API = 'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search';
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  private cache: { items: EncyclopediaItem[]; cachedAt: number } | null = null;

  async getConditions(
    search?: string,
  ): Promise<{ total: number; items: EncyclopediaItem[] }> {
    const all = await this.loadAll();

    if (!search?.trim()) {
      return { total: all.length, items: all };
    }

    const keyword = search.trim().toLowerCase();
    const filtered = all.filter((item) =>
      item.name.toLowerCase().includes(keyword),
    );
    return { total: filtered.length, items: filtered };
  }

  private async loadAll(): Promise<EncyclopediaItem[]> {
    if (this.cache && Date.now() - this.cache.cachedAt < this.CACHE_TTL) {
      return this.cache.items;
    }

    try {
      const { data } = await axios.get<NihResponse>(this.NIH_API, {
        params: { terms: '', maxList: 500, ef: 'icd10cm_codes' },
        timeout: 10000,
      });

      const [, , extraFields, rows] = data;
      const icdMap = extraFields?.icd10cm_codes ?? [];

      const items: EncyclopediaItem[] = rows.map((row, i) => ({
        id: `condition-${i}`,
        name: row[0],
        icdCodes: icdMap[i] ?? [],
      }));

      this.cache = { items, cachedAt: Date.now() };
      this.logger.log(`NIH 데이터 캐싱 완료: ${items.length}개`);
      return items;
    } catch (error) {
      this.logger.error(`NIH API 호출 실패: ${(error as Error).message}`);
      return this.cache?.items ?? [];
    }
  }
}
