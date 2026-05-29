import { FirstAidLogListener } from './first-aid-log.listener';
import { PrismaService } from '../../prisma/prisma.service';
import { FirstAidAdviceCompletedEvent, FIRST_AID_ADVICE_COMPLETED } from '../events/first-aid.events';
import { SymptomType } from '@prisma/client';

describe('FirstAidLogListener', () => {
  let listener: FirstAidLogListener;
  let prisma: jest.Mocked<Pick<PrismaService, 'firstAidLog'>>;

  beforeEach(() => {
    prisma = {
      firstAidLog: { create: jest.fn() },
    } as unknown as jest.Mocked<Pick<PrismaService, 'firstAidLog'>>;
    listener = new FirstAidLogListener(prisma as unknown as PrismaService);
  });

  const makeEvent = (userId?: number): FirstAidAdviceCompletedEvent => {
    const event = new FirstAidAdviceCompletedEvent();
    event.userId = userId;
    event.symptomType = SymptomType.BLEEDING;
    event.countryCode = 'KR';
    event.confidence = 85;
    return event;
  };

  it('정상 이벤트 → firstAidLog.create 호출', async () => {
    (prisma.firstAidLog.create as jest.Mock).mockResolvedValue({});

    await listener.handleAdviceCompleted(makeEvent(1));

    expect(prisma.firstAidLog.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        symptomType: SymptomType.BLEEDING,
        countryCode: 'KR',
        confidence: 85,
      },
    });
  });

  it('userId 없는 이벤트 → userId: null 저장', async () => {
    (prisma.firstAidLog.create as jest.Mock).mockResolvedValue({});

    await listener.handleAdviceCompleted(makeEvent(undefined));

    expect(prisma.firstAidLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: null }),
    });
  });

  it('DB 저장 실패 → 예외 throw 없이 에러 로그만', async () => {
    (prisma.firstAidLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(listener.handleAdviceCompleted(makeEvent(1))).resolves.not.toThrow();
  });
});
