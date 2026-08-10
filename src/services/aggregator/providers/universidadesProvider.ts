import { AggregatorProviderConfig } from '../types';

export const UniversidadesProviderConfig: AggregatorProviderConfig = {
  id: 'universidades',
  name: 'Universidades & Feiras Acadêmicas',
  description: 'Congressos, Simpósios e Feiras Tecnológicas (Unicamp, USP, UNESP, Facamp, Puccamp)',
  type: 'rss',
  trustScore: 85,
  enabled: true,
  rateLimitMs: 900,
  totalEventsFound: 112,
  errorCount: 0,
};

export const MOCK_UNIVERSIDADES_RAW_EVENTS = [
  {
    title: '34ª Feira de Ciência & Inovação Tecnológica Unicamp',
    category: 'Educacao',
    date: '18/09 - 21/09',
    time: '08:30 - 17:00',
    address: 'Ginásio Multidisciplinar da Unicamp - Barão Geraldo',
    city: 'Campinas - SP',
    price: 'Gratuito',
    isPaid: false,
    organizer: 'Pró-Reitoria de Pesquisa Unicamp',
    officialLink: 'https://www.unicamp.br/unicamp/agenda/feira-de-ciencia-inovacao-2026',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  }
];
