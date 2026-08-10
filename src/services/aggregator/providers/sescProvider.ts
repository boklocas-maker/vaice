import { AggregatorProviderConfig } from '../types';

export const SescProviderConfig: AggregatorProviderConfig = {
  id: 'sesc',
  name: 'SESC SP & Regional',
  description: 'Programação oficial do SESC em Teatro, Música, Cinema e Oficinas',
  type: 'rss',
  trustScore: 90,
  enabled: true,
  rateLimitMs: 800,
  totalEventsFound: 210,
  errorCount: 0,
};

export const MOCK_SESC_RAW_EVENTS = [
  {
    title: 'Mostra de Teatro Contemporâneo do SESC',
    category: 'Teatro',
    date: '12/09 - 22/09',
    time: '20:00 - 22:00',
    address: 'SESC Campinas - Rua Dom José I, 270 - Bonfim',
    city: 'Campinas - SP',
    price: 'R$ 15,00',
    isPaid: true,
    organizer: 'SESC São Paulo',
    officialLink: 'https://www.sescsp.org.br/programacao/mostra-teatro-campinas/',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Cine-Debate: Clássicos do Cinema Nacional',
    category: 'Cinema',
    date: '05/09',
    time: '19:30 - 21:30',
    address: 'Teatro SESC Hortolândia',
    city: 'Hortolândia - SP',
    price: 'Gratuito',
    isPaid: false,
    organizer: 'SESC Núcleo Audiovisual',
    officialLink: 'https://www.sescsp.org.br/programacao/cine-debate-hortolandia/',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  }
];
