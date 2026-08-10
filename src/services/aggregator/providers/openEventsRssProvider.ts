import { AggregatorProviderConfig } from '../types';

export const OpenEventsRssProviderConfig: AggregatorProviderConfig = {
  id: 'openRss',
  name: 'Feeds RSS, JSON/XML & Schema.org',
  description: 'Leitor universal de Schema.org Event, OpenGraph e Feeds RSS/Atom de centros culturais',
  type: 'rss',
  trustScore: 80,
  enabled: true,
  rateLimitMs: 500,
  totalEventsFound: 320,
  errorCount: 0,
};

export const MOCK_OPEN_RSS_EVENTS = [
  {
    title: 'Exposição de Arte Contemporânea: Luz & Movimento',
    category: 'Exposicao',
    date: '01/09 - 30/09',
    time: '10:00 - 18:00',
    address: 'MACC - Museu de Arte Contemporânea de Campinas',
    city: 'Campinas - SP',
    price: 'Gratuito',
    isPaid: false,
    organizer: 'MACC & Coletivos Artísticos',
    officialLink: 'https://macc.campinas.sp.gov.br/exposicao-luz-movimento',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  }
];
