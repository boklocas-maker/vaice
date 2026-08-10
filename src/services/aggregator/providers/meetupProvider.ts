import { AggregatorProviderConfig } from '../types';

export const MeetupProviderConfig: AggregatorProviderConfig = {
  id: 'meetup',
  name: 'Meetup Communities',
  description: 'Provedor de encontros de tecnologia, astronomia e idiomas',
  type: 'schema_html',
  trustScore: 70,
  enabled: true,
  rateLimitMs: 1500,
  totalEventsFound: 64,
  errorCount: 0,
};

export const MOCK_MEETUP_RAW_EVENTS = [
  {
    title: 'Meetup Devs & IA Generativa Campinas',
    category: 'Tecnologia',
    date: '10/09',
    time: '19:00 - 21:30',
    address: 'Hub de Inovação H-59 - Barão Geraldo',
    city: 'Campinas - SP',
    price: 'Gratuito',
    isPaid: false,
    organizer: 'Comunidade Meetup JS & Python Campinas',
    officialLink: 'https://www.meetup.com/pt-BR/campinas-ai-devs/events/301928/',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  }
];
