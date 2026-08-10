import { AggregatorProviderConfig } from '../types';

export const PrefeituraCampinasProviderConfig: AggregatorProviderConfig = {
  id: 'prefeituraCampinas',
  name: 'Prefeituras & Sec. de Cultura',
  description: 'Diário oficial, portais de cultura municipais e feiras de rua de Campinas, Hortolândia e RMC',
  type: 'schema_html',
  trustScore: 90,
  enabled: true,
  rateLimitMs: 1000,
  totalEventsFound: 185,
  errorCount: 0,
};

export const MOCK_PREFEITURA_RAW_EVENTS = [
  {
    title: 'Feira Gastronômica & Arte Noturna da Estação Cultura',
    category: 'Gastronomia',
    date: '08/09 - 10/09',
    time: '17:00 - 23:00',
    address: 'Estação Cultura - Praça Marechal Floriano Peixoto',
    city: 'Campinas - SP',
    price: 'Gratuito',
    isPaid: false,
    organizer: 'Secretaria Municipal de Cultura e Turismo',
    officialLink: 'https://www.campinas.sp.gov.br/cultura/agenda/estacao-arte.php',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  }
];
