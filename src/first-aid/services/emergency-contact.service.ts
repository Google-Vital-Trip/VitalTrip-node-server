import { Injectable } from '@nestjs/common';
import { EmergencyContact, EMERGENCY_CONTACTS } from '../constants/emergency-contacts';

@Injectable()
export class EmergencyContactService {
  getContacts(countryCode: string): EmergencyContact {
    return EMERGENCY_CONTACTS[countryCode] ?? EMERGENCY_CONTACTS['DEFAULT'];
  }
}
