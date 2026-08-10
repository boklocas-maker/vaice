import { AggregatorProviderConfig } from '../types';

export const SymplaProviderConfig: AggregatorProviderConfig = {
  id: 'sympla',
  name: 'Sympla Brasil',
  description: 'API & Crawling de Eventos, Shows, Workshops e Teatros Sympla',
  type: 'api',
  trustScore: 95,
  enabled: true,
  rateLimitMs: 1000,
  totalEventsFound: 142,
  errorCount: 0,
};

export const MOCK_SYMPLA_RAW_EVENTS = [
  {
    title: 'Festival da Primavera Sympla Campinas',
    category: 'Musica',
    date: '15/09 - 17/09',
    time: '14:00 - 22:00',
    address: 'Parque Taquaral - Portão 5',
    city: 'Campinas - SP',
    price: 'Gratuito',
    isPaid: false,
    organizer: 'Sympla Culturas & Eventos',
    officialLink: 'https://www.sympla.com.br/evento/festival-da-primavera-campinas/192842',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    rawHtmlSchema: '<script type="application/ld+json">{"@type":"Event","name":"Festival da Primavera Sympla Campinas"}</script>'
  },
  {
    title: 'Summit Tech & Startups RMC 2026',
    category: 'Tecnologia',
    date: '20/09',
    time: '09:00 - 18:00',
    address: 'Expo D. Pedro - Av. Guilherme Campos, 500',
    city: 'Campinas - SP',
    price: 'R$ 49,90',
    isPaid: true,
    organizer: 'Campinas Tech Alliance & Sympla Biz',
    officialLink: 'https://www.sympla.com.br/evento/summit-tech-rmc/284910',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    rawHtmlSchema: '<script type="application/ld+json">{"@type":"Event","name":"Summit Tech & Startups"}</script>'
  }
];
