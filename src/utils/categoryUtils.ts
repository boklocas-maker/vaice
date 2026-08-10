import { EventCategory } from '../types';

export function normalizeCategory(catString: string = ''): EventCategory {
  const c = catString.toLowerCase().trim();
  if (!c) return 'Exposição e Artes';

  if (c.includes('músic') || c.includes('music') || c.includes('show') || c.includes('concerto') || c.includes('orquestra') || c.includes('banda') || c.includes('coral')) {
    return 'Evento Musical';
  }
  if (c.includes('dança') || c.includes('danca') || c.includes('ballet') || c.includes('samba')) {
    return 'Dança e Expressão';
  }
  if (c.includes('teatro') || c.includes('espetáculo') || c.includes('espetaculo') || c.includes('performance') || c.includes('drama') || c.includes('comédia') || c.includes('cena')) {
    return 'Teatro e Performance';
  }
  if (c.includes('literat') || c.includes('livro') || c.includes('poesia') || c.includes('sarau') || c.includes('leitura')) {
    return 'Literatura e Livros';
  }
  if (c.includes('gastro') || c.includes('culinár') || c.includes('comida') || c.includes('gastronomia') || c.includes('food') || c.includes('cerveja')) {
    return 'Gastronomia e Cultura';
  }
  if (c.includes('feira') || c.includes('artesanal') || c.includes('artesanato') || c.includes('bazar') || c.includes('mercado')) {
    return 'Feira artesanal';
  }
  if (c.includes('tecno') || c.includes('geek') || c.includes('game') || c.includes('jogos') || c.includes('cosplay')) {
    return 'Tecnologia e Geek';
  }
  if (c.includes('cine') || c.includes('filme') || c.includes('audiovisual') || c.includes('mostra de cinema')) {
    return 'Cinema e Audiovisual';
  }
  if (c.includes('exposi') || c.includes('arte') || c.includes('museu') || c.includes('galeria') || c.includes('escultura') || c.includes('quadro')) {
    return 'Exposição e Artes';
  }

  return 'Exposição e Artes';
}

export function isCategoryMatch(eventCategory: string = '', filterCategory: string = ''): boolean {
  if (!filterCategory || filterCategory === 'Todas as categorias' || filterCategory === 'all') return true;

  const normalizedEventCat = normalizeCategory(eventCategory);
  const normalizedFilterCat = normalizeCategory(filterCategory);

  if (normalizedEventCat === normalizedFilterCat) return true;

  const cat = eventCategory.toLowerCase();
  const filter = filterCategory.toLowerCase();

  return cat.includes(filter) || filter.includes(cat);
}
