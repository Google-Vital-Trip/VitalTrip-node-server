export interface EmergencyContact {
  fire: string;
  police: string;
  medical: string;
  general: string;
}

export const EMERGENCY_CONTACTS: Record<string, EmergencyContact> = {
  KR: { fire: '119', police: '112', medical: '119', general: '112' },
  US: { fire: '911', police: '911', medical: '911', general: '911' },
  CA: { fire: '911', police: '911', medical: '911', general: '911' },
  JP: { fire: '119', police: '110', medical: '119', general: '119' },
  CN: { fire: '119', police: '110', medical: '120', general: '120' },
  GB: { fire: '999', police: '999', medical: '999', general: '999' },
  DE: { fire: '112', police: '110', medical: '112', general: '112' },
  FR: { fire: '18', police: '17', medical: '15', general: '112' },
  AU: { fire: '000', police: '000', medical: '000', general: '000' },
  TH: { fire: '199', police: '191', medical: '1669', general: '191' },
  VN: { fire: '114', police: '113', medical: '115', general: '113' },
  SG: { fire: '995', police: '999', medical: '995', general: '999' },
  PH: { fire: '160', police: '117', medical: '911', general: '911' },
  MY: { fire: '994', police: '999', medical: '999', general: '999' },
  ID: { fire: '113', police: '110', medical: '118', general: '112' },
  IN: { fire: '101', police: '100', medical: '108', general: '112' },
  DEFAULT: { fire: '112', police: '112', medical: '112', general: '112' },
};
