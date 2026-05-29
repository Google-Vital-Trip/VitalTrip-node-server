import { FirstAidLogListener } from './first-aid-log.listener';
import { PrismaService } from '../../prisma/prisma.service';
import { FirstAidAdviceCompletedEvent } from '../events/first-aid.events';
import { SymptomType } from '@prisma/client';

const makeEvent = (userId?: number): FirstAidAdviceCompletedEvent => {
  const event = new FirstAidAdviceCompletedEvent();
  event.userId = userId;
  event.symptomType = SymptomType.BLEEDING;
  event.countryCode = 'KR';
  event.confidence = 85;
  return event;
};

describe('FirstAidLogListener', () => {
  let listener: FirstAidLogListener;
  let createFn: jest.Mock;

  beforeEach(() => {
    createFn = jest.fn();
    const prisma = {
      firstAidLog: { create: createFn },
    } as unknown as PrismaService;
    listener = new FirstAidLogListener(prisma);
  });

  it('정상 이벤트 → firstAidLog.create 호출', async () => {
    createFn.mockResolvedValue({});

    await listener.handleAdviceCompleted(makeEvent(1));

    expect(createFn).toHaveBeenCalledWith({
      data: {
        userId: 1,
        symptomType: SymptomType.BLEEDING,
        countryCode: 'KR',
        confidence: 85,
      },
    });
  });

  it('userId 없는 이벤트 → userId: null 저장', async () => {
    createFn.mockResolvedValue({});

    await listener.handleAdviceCompleted(makeEvent(undefined));

    expect(createFn).toHaveBeenCalledWith({
      data: {
        userId: null,
        symptomType: SymptomType.BLEEDING,
        countryCode: 'KR',
        confidence: 85,
      },
    });
  });

  it('DB 저장 실패 → 예외 throw 없이 처리', async () => {
    createFn.mockRejectedValue(new Error('DB Error'));

    let threw = false;
    try {
      await listener.handleAdviceCompleted(makeEvent(1));
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});
