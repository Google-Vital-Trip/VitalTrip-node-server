import { Test, TestingModule } from '@nestjs/testing';
import { EncyclopediaService } from './encyclopedia.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  healthTopic: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

const rawTopic = {
  id: 1,
  title: 'Burns',
  altTitles: '["Chemical Burns","Thermal Burns"]',
  summary: 'Burns are caused by heat.',
  categories: '["Injuries"]',
  url: 'https://medlineplus.gov/burns.html',
};

describe('EncyclopediaService', () => {
  let service: EncyclopediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncyclopediaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EncyclopediaService>(EncyclopediaService);
    jest.clearAllMocks();
  });

  it('search 없음 → where: {} 조건으로 전체 조회', async () => {
    mockPrisma.healthTopic.count.mockResolvedValue(1);
    mockPrisma.healthTopic.findMany.mockResolvedValue([rawTopic]);

    const result = await service.getTopics(undefined, 0, 50);

    expect(result.total).toBe(1);
    expect(mockPrisma.healthTopic.count).toHaveBeenCalledWith({ where: {} });
  });

  it('search 있음 → OR 조건 포함', async () => {
    mockPrisma.healthTopic.count.mockResolvedValue(1);
    mockPrisma.healthTopic.findMany.mockResolvedValue([rawTopic]);

    await service.getTopics('Burns', 0, 50);

    expect(mockPrisma.healthTopic.count).toHaveBeenCalledWith({
      where: { OR: expect.arrayContaining([expect.objectContaining({ title: expect.anything() })]) },
    });
  });

  it('altTitles JSON 문자열 → 배열로 파싱', async () => {
    mockPrisma.healthTopic.count.mockResolvedValue(1);
    mockPrisma.healthTopic.findMany.mockResolvedValue([rawTopic]);

    const result = await service.getTopics();

    expect(Array.isArray(result.items[0].altTitles)).toBe(true);
    expect(result.items[0].altTitles).toContain('Chemical Burns');
  });

  it('categories JSON 문자열 → 배열로 파싱', async () => {
    mockPrisma.healthTopic.count.mockResolvedValue(1);
    mockPrisma.healthTopic.findMany.mockResolvedValue([rawTopic]);

    const result = await service.getTopics();

    expect(Array.isArray(result.items[0].categories)).toBe(true);
  });
});
