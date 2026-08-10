import { CulturalEvent } from '../types';

const FALLBACK_TEMPLATES: Array<Pick<CulturalEvent, 'title' | 'category' | 'description' | 'address' | 'cityRegion' | 'image' | 'organizer' | 'pinColor'>> = [
  {
    title: 'Noite de MPB no Parque Taquaral',
    category: 'Evento Musical',
    description: 'Show gratuito com artistas locais de MPB e opções gastronômicas.',
    address: 'Parque Taquaral - Av. Dr. Heitor Penteado',
    cityRegion: 'Campinas - SP',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
    organizer: 'Prefeitura de Campinas',
    pinColor: 'purple',
  },
  {
    title: 'Feira de Artesanato & Design Autoral',
    category: 'Feira artesanal',
    description: 'Exposição e venda de peças artesanais, moda sustentável e decoração.',
    address: 'Praça do Congresso - Centro',
    cityRegion: 'Campinas - SP',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    organizer: 'Coletivo de Artes',
    pinColor: 'orange',
  },
  {
    title: 'Teatro Infantil: A Ilha Fantástica',
    category: 'Teatro e Performance',
    description: 'Espetáculo teatral interativo para toda a família com entrada franca.',
    address: 'Centro Cultural - Rua Dom José I, 270',
    cityRegion: 'Campinas - SP',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&q=80',
    organizer: 'Cia de Teatro Sol',
    pinColor: 'green',
  },
  {
    title: 'Festival Gastronômico de Verão',
    category: 'Gastronomia e Cultura',
    description: 'Especialidades regionais, chefs convidados e apresentações acústicas.',
    address: 'Rua Dr. Moraes Salles - Cambuí',
    cityRegion: 'Campinas - SP',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    organizer: 'Associação Cambuí',
    pinColor: 'blue',
  },
  {
    title: 'Exposição de Arte Contemporânea',
    category: 'Exposição e Artes',
    description: 'Mostra coletiva com obras em pintura, escultura e instalações imersivas.',
    address: 'Galeria Estação - Vila Itapura',
    cityRegion: 'Campinas - SP',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
    organizer: 'Galeria de Arte',
    pinColor: 'yellow',
  },
  {
    title: 'Sarau e Roda de Poesia na Praça',
    category: 'Evento artístico - Poesia',
    description: 'Declamações abertas, oficina de escrita e música instrumental.',
    address: 'Largo do Rosário - Centro',
    cityRegion: 'Campinas - SP',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
    organizer: 'Coletivo Poético',
    pinColor: 'red',
  },
  {
    title: 'Festival de Cinema Independente',
    category: 'Cinema e Audiovisual',
    description: 'Exibição de curtas e longas metragens premiados com debate de diretores.',
    address: 'Cine Teatro Municipal - Centro',
    cityRegion: 'São Paulo - SP',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    organizer: 'Cineclube Brasil',
    pinColor: 'purple',
  },
  {
    title: 'Concerto Clássico na Catedral',
    category: 'Evento Musical',
    description: 'Apresentação especial da Orquestra Sinfônica com repertório de Vivaldi.',
    address: 'Catedral Metropolitana',
    cityRegion: 'Rio de Janeiro - RJ',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    organizer: 'Orquestra Sinfônica',
    pinColor: 'blue',
  },
  {
    title: 'Feira Literária e Encontro de Autores',
    category: 'Literatura e Livros',
    description: 'Lançamento de livros, sessões de autógrafos e rodas de conversa.',
    address: 'Biblioteca Pública do Estado',
    cityRegion: 'Belo Horizonte - MG',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    organizer: 'Editora Cultural',
    pinColor: 'green',
  },
  {
    title: 'Mostra de Dança Contemporânea',
    category: 'Dança e Expressão',
    description: 'Coreografias inovadoras combinando dança urbana e expressão lírica.',
    address: 'Teatro Castro Alves',
    cityRegion: 'Salvador - BA',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    organizer: 'Companhia de Dança',
    pinColor: 'red',
  }
];

const BRASIL_LOCATIONS = [
  { cityRegion: 'Campinas - SP', lat: -22.9068, lng: -47.0614 },
  { cityRegion: 'São Paulo - SP', lat: -23.5505, lng: -46.6333 },
  { cityRegion: 'Rio de Janeiro - RJ', lat: -22.9068, lng: -43.1729 },
  { cityRegion: 'Belo Horizonte - MG', lat: -19.9167, lng: -43.9345 },
  { cityRegion: 'Curitiba - PR', lat: -25.4284, lng: -49.2733 },
  { cityRegion: 'Porto Alegre - RS', lat: -30.0346, lng: -51.2177 },
  { cityRegion: 'Salvador - BA', lat: -12.9777, lng: -38.5016 },
  { cityRegion: 'Recife - PE', lat: -8.0476, lng: -34.8770 },
  { cityRegion: 'Fortaleza - CE', lat: -3.7172, lng: -38.5433 },
  { cityRegion: 'Brasília - DF', lat: -15.7975, lng: -47.8919 },
];

export function buildFallbackEvents(
  count: number = 0,
  userLocation?: { lat: number; lng: number } | null
): CulturalEvent[] {
  return [];
}

export const INITIAL_EVENTS: CulturalEvent[] = [];
