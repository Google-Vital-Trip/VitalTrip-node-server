import { EmergencyContactService } from './emergency-contact.service';

describe('EmergencyContactService', () => {
  let service: EmergencyContactService;

  beforeEach(() => {
    service = new EmergencyContactService();
  });

  it('등록된 국가코드(KR) → 한국 응급번호 반환', () => {
    const result = service.getContacts('KR');
    expect(result.police).toBe('112');
    expect(result.medical).toBe('119');
    expect(result.fire).toBe('119');
  });

  it('등록된 국가코드(US) → 미국 응급번호 반환', () => {
    const result = service.getContacts('US');
    expect(result.general).toBe('911');
  });

  it('미등록 국가코드 → DEFAULT 반환', () => {
    const result = service.getContacts('XX');
    expect(result).toBeDefined();
    expect(result.general).toBeTruthy();
  });

  it('UNKNOWN → DEFAULT 반환', () => {
    const result = service.getContacts('UNKNOWN');
    expect(result).toBeDefined();
    expect(result.general).toBeTruthy();
  });
});
