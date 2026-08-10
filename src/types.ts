export type EventCategory = 
  | 'Evento Musical'
  | 'Feira artesanal'
  | 'Evento artístico - Poesia'
  | 'Teatro e Performance'
  | 'Gastronomia e Cultura'
  | 'Literatura e Livros'
  | 'Tecnologia e Geek'
  | 'Dança e Expressão'
  | 'Exposição e Artes'
  | 'Cinema e Audiovisual'
  | 'Cultura Popular e Tradição';

export interface EventScheduleItem {
  time?: string;
  title: string;
}

export interface EventScheduleDay {
  dayNumber: number;
  monthShort: string;
  items: EventScheduleItem[];
}

export interface EventReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CulturalEvent {
  id: string;
  title: string;
  dateRange: string; // e.g. "08/08 - 09/08"
  category: EventCategory;
  description: string;
  address: string;
  cityRegion: string;
  lat: number;
  lng: number;
  image: string;
  rating: number; // e.g. 5.0
  reviewsCount: number; // e.g. 1495
  isVirtual: boolean;
  virtualLink?: string;
  isPaid: boolean;
  price?: string; // "Gratuito" or "R$ 20,00"
  distanceKm: number;
  travelTimeMinutes: number;
  organizer: string;
  isAiGenerated?: boolean;
  sourceUrl?: string;
  isHappeningNow?: boolean;
  schedule?: EventScheduleDay[];
  reviews?: EventReview[];
  pinColor: 'yellow' | 'red' | 'green' | 'blue' | 'purple' | 'orange';
}

export interface AccessibilitySettings {
  fontSize: 'pequeno' | 'padrao' | 'medio' | 'grande';
  textSpacing: 'normal' | 'largo' | 'extra';
  dyslexiaFont: boolean;
  daltonismFilter: 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  reduceAnimations: boolean;
  disableVisualFX: boolean;
  largeCursor: boolean;
  largeClickArea: boolean;
  virtualAssistantAudio: boolean;
}

export interface EventReminder {
  eventId: string;
  alertOffsetMinutes: number; // e.g. 15, 60, 1440
  createdAt: string;
}

export interface UserProfile {
  isLoggedIn: boolean;
  name: string;
  email: string;
  savedEventIds: string[];
  participatedEventIds: string[];
  reminders: EventReminder[];
  userReviews: { eventId: string; rating: number; comment: string; date: string }[];
}

export interface QuizAnswers {
  categories: EventCategory[];
  format: 'presencial' | 'virtual' | 'tanto_faz';
  cost: 'gratuito' | 'pago' | 'tanto_faz';
  timing: 'hoje' | 'proximos_dias' | 'qualquer_momento';
}
