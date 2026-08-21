export interface EmergencyContact {
  id: string;
  name: string;
  category: 'medical' | 'police' | 'fire' | 'assistance' | 'tourist' | 'women' | 'disaster';
  number: string;
  alternateNumber?: string;
  description: string;
  icon: string;
  isPrimary: boolean;
  tollFree?: boolean;
}

export interface DistrictEmergencyCenter {
  districtId: string;
  districtName: string;
  policeControlRoom: string;
  chiefMedicalOffice: string;
  sadarHospital: string;
  touristPoliceOrHelpline?: string;
  notes?: string;
}

// Centralized Admin Emergency Configuration
export const ADMIN_CONTACT_CONFIG = {
  name: 'Admin',
  phone: '9250596871',
} as const;

// Verified National & State Emergency Contacts for India & Jharkhand
export const EMERGENCY_SERVICES: EmergencyContact[] = [
  {
    id: 'erss-112',
    name: 'National Emergency Helpline (ERSS)',
    category: 'assistance',
    number: '112',
    description: 'Unified 24x7 emergency response for Police, Fire, and Ambulance across India',
    icon: '🆘',
    isPrimary: true,
    tollFree: true,
  },
  {
    id: 'medical-108',
    name: 'Medical Emergency & Ambulance',
    category: 'medical',
    number: '108',
    alternateNumber: '102',
    description: 'Free 24x7 emergency medical response and patient transport (NHM Jharkhand)',
    icon: '🚑',
    isPrimary: true,
    tollFree: true,
  },
  {
    id: 'police-100',
    name: 'Police Control Room',
    category: 'police',
    number: '100',
    alternateNumber: '112',
    description: 'Immediate law enforcement, safety assistance, and patrol dispatch',
    icon: '👮',
    isPrimary: true,
    tollFree: true,
  },
  {
    id: 'fire-101',
    name: 'Fire & Rescue Services',
    category: 'fire',
    number: '101',
    description: 'Emergency fire suppression, forest fire rescue, and disaster extraction',
    icon: '🚒',
    isPrimary: true,
    tollFree: true,
  },
  {
    id: 'tourist-1363',
    name: 'Tourist Safety Helpline',
    category: 'tourist',
    number: '1363',
    alternateNumber: '1800-11-1363',
    description: 'Ministry of Tourism 24x7 multi-lingual tourist assistance & guidance',
    icon: '🧳',
    isPrimary: false,
    tollFree: true,
  },
  {
    id: 'women-1091',
    name: 'Women Safety Helpline',
    category: 'women',
    number: '1091',
    alternateNumber: '181',
    description: '24x7 emergency helpline for women travelers, safety, and rapid support',
    icon: '🛡️',
    isPrimary: false,
    tollFree: true,
  },
  {
    id: 'disaster-1070',
    name: 'State Disaster Management (SEOC)',
    category: 'disaster',
    number: '1070',
    alternateNumber: '0651-2446923',
    description: 'Jharkhand State Emergency Operation Centre for severe weather and floods',
    icon: '⚡',
    isPrimary: false,
    tollFree: true,
  },
];

// Verified District Headquarters Control Rooms & Hospitals in Jharkhand
export const JHARKHAND_DISTRICT_EMERGENCY: DistrictEmergencyCenter[] = [
  {
    districtId: 'ranchi',
    districtName: 'Ranchi (State Capital)',
    policeControlRoom: '0651-2208888',
    chiefMedicalOffice: '0651-2214401',
    sadarHospital: '0651-2215161',
    touristPoliceOrHelpline: '112 / 0651-2208888',
    notes: 'RIMS Super-speciality Trauma Centre: 0651-2541533',
  },
  {
    districtId: 'east-singhbhum',
    districtName: 'East Singhbhum (Jamshedpur)',
    policeControlRoom: '0657-2431024',
    chiefMedicalOffice: '0657-2431222',
    sadarHospital: '0657-2283088',
    touristPoliceOrHelpline: '112',
    notes: 'MGM Medical College & Hospital Jamshedpur',
  },
  {
    districtId: 'dhanbad',
    districtName: 'Dhanbad',
    policeControlRoom: '0326-2311217',
    chiefMedicalOffice: '0326-2230465',
    sadarHospital: '0326-2312222',
    touristPoliceOrHelpline: '112',
    notes: 'SNMMCH Medical Hospital Dhanbad',
  },
  {
    districtId: 'deoghar',
    districtName: 'Deoghar (Baidyanath Dham)',
    policeControlRoom: '06432-222324',
    chiefMedicalOffice: '06432-222256',
    sadarHospital: '06432-222324',
    touristPoliceOrHelpline: '06432-232295',
    notes: 'AIIMS Deoghar Emergency & Pilgrim Assistance Booths Active',
  },
  {
    districtId: 'hazaribagh',
    districtName: 'Hazaribagh',
    policeControlRoom: '06546-264426',
    chiefMedicalOffice: '06546-264402',
    sadarHospital: '06546-222224',
    touristPoliceOrHelpline: '112',
    notes: 'HMC Hospital & National Park Forest Control',
  },
  {
    districtId: 'latehar',
    districtName: 'Latehar & Netarhat (Betla)',
    policeControlRoom: '06565-244222',
    chiefMedicalOffice: '06565-244211',
    sadarHospital: '06565-244222',
    touristPoliceOrHelpline: 'Betla Range Officer: 06562-222650',
    notes: 'Netarhat Primary Health Centre & Betla Tiger Reserve Gate Control',
  },
  {
    districtId: 'giridih',
    districtName: 'Giridih & Parasnath (Shikharji)',
    policeControlRoom: '06532-222030',
    chiefMedicalOffice: '06532-222168',
    sadarHospital: '06532-222033',
    touristPoliceOrHelpline: 'Parasnath Pilgrim Cell: 06532-232100',
    notes: 'Madhuban Pilgrim Medical Camp at Hill Foot',
  },
  {
    districtId: 'dumka',
    districtName: 'Dumka (Santhal Pargana)',
    policeControlRoom: '06434-222222',
    chiefMedicalOffice: '06434-222243',
    sadarHospital: '06434-222224',
    touristPoliceOrHelpline: '112',
    notes: 'Phulo Jhano Medical College Hospital',
  },
  {
    districtId: 'west-singhbhum',
    districtName: 'West Singhbhum (Chaibasa & Saranda)',
    policeControlRoom: '06582-256334',
    chiefMedicalOffice: '06582-256322',
    sadarHospital: '06582-256345',
    touristPoliceOrHelpline: 'Saranda Forest Control: 06582-256310',
    notes: 'Chaibasa Sadar Hospital & Forest Range Outposts',
  },
];

/**
 * Builds Google Maps search URL for nearby emergency facilities based on coordinates
 */
export function getNearbyEmergencyFacilitySearchUrl(
  lat: number,
  lng: number,
  type: 'hospital' | 'police' | 'fire'
): string {
  const query = type === 'hospital' ? 'hospital' : type === 'police' ? 'police station' : 'fire station';
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},14z`;
}

/**
 * Builds Google Maps directions navigation URL
 */
export function getExternalNavigationDirectionsUrl(
  destLat: number,
  destLng: number,
  originLat?: number,
  originLng?: number,
  destName?: string
): string {
  if (originLat !== undefined && originLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
  }
  const destinationQuery = destName ? encodeURIComponent(destName) : `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;
}
