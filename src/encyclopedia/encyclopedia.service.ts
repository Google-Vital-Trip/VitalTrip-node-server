import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthTopicItem {
  id: number;
  title: string;
  altTitles: string[];
  summary: string;
  categories: string[];
  url: string;
}

@Injectable()
export class EncyclopediaService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopics(
    search?: string,
    offset = 0,
    limit = 50,
  ): Promise<{ total: number; items: HealthTopicItem[] }> {
    const keyword = search?.trim();
    const where = keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { altTitles: { contains: keyword } },
          ],
        }
      : {};

    const [total, rows] = await Promise.all([
      this.prisma.healthTopic.count({ where }),
      this.prisma.healthTopic.findMany({
        where,
        select: {
          id: true,
          title: true,
          altTitles: true,
          summary: true,
          categories: true,
          url: true,
        },
        orderBy: { title: 'asc' },
        skip: offset,
        take: limit,
      }),
    ]);

    return {
      total,
      items: rows.map(
        (r): HealthTopicItem => ({
          ...r,
          altTitles: JSON.parse(r.altTitles) as string[],
          categories: JSON.parse(r.categories) as string[],
        }),
      ),
    };
  }
}
