import { EventTrustScore } from './types';

export class TrustScoreEngine {
  public static calculateScore(sourceName: string, providerType: string): EventTrustScore {
    const s = sourceName.toLowerCase();
    
    if (s.includes('oficial') || s.includes('site oficial') || s.includes('domínio próprio')) {
      return { score: 100, label: 'Site Oficial do Evento', categoryRating: 'MAXIMA' };
    }
    
    if (providerType === 'api' || s.includes('api oficial') || s.includes('sympla') || s.includes('eventbrite')) {
      return { score: 95, label: 'API Oficial Plataforma', categoryRating: 'MAXIMA' };
    }
    
    if (s.includes('prefeitura') || s.includes('secretaria') || s.includes('gov.br') || s.includes('sesc') || s.includes('sesi') || s.includes('senac')) {
      return { score: 90, label: 'Prefeitura / Secretaria de Cultura', categoryRating: 'ALTA' };
    }
    
    if (s.includes('universidade') || s.includes('unicamp') || s.includes('usp') || s.includes('unesp') || s.includes('faculdade')) {
      return { score: 85, label: 'Universidade / Instituição de Ensino', categoryRating: 'ALTA' };
    }
    
    if (s.includes('empresa') || s.includes('produtora') || s.includes('casa de show') || s.includes('teatro')) {
      return { score: 80, label: 'Empresa Organizadora', categoryRating: 'ALTA' };
    }
    
    if (s.includes('portal') || s.includes('g1') || s.includes('agenda') || s.includes('fever') || s.includes('meetup')) {
      return { score: 70, label: 'Portais Conhecidos de Imprensa', categoryRating: 'MEDIA' };
    }

    if (s.includes('blog') || s.includes('coluna') || s.includes('fanpage')) {
      return { score: 50, label: 'Blogs e Guias Independentes', categoryRating: 'MEDIA' };
    }
    
    return { score: 20, label: 'Fontes Desconhecidas / Redes Sociais Gerais', categoryRating: 'BAIXA' };
  }
}
