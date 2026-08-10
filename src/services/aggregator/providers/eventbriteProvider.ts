import { AggregatorProviderConfig } from '../types';

export const EventbriteProviderConfig: AggregatorProviderConfig = {
  id: 'eventbrite',
  name: 'Eventbrite Global & BR',
  description: 'Feed OpenGraph e API public Eventbrite para congressos, feiras e artes',
  type: 'rss',
  trustScore: 95,
  enabled: true,
  rateLimitMs: 1200,
  totalEventsFound: 98,
  errorCount: 0,
};

export const MOCK_EVENTBRITE_RAW_EVENTS = [
  {
    title: 'Feira Internacional de Cerveja Artesanal e Gastronomia',
    category: 'Gastronomia',
    date: '28/09 - 30/09',
    time: '12:00 - 23:00',
    address: 'Praça da Imprensa - Cambuí',
    city: 'Campinas - SP',
    price: 'R$ 20,00',
    isPaid: true,
    organizer: 'Associação de Cervejeiros & Eventbrite',
    officialLink: 'https://www.eventbrite.com.br/e/feira-cerveja-artesanal-campinas-tickets-991823',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    ogMetadata: { 'og:title': 'Feira Internacional Cerveja Artesanal', 'og:type': 'event' }
  }
];
