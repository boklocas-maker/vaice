// High-confidence domains with verified real deep event pages
const VERIFIED_EVENT_DOMAINS = [
  'sescsp.org.br',
  'feverup.com',
  'sympla.com.br',
  'eventbrite.com.br',
  'campinas.com.br',
  'ondevamo.com',
  'portalbelohorizonte.com.br',
  'royalpalmeventos.com.br',
  'multiarenacampinas.com.br',
  'casadeartistas.com.br',
  'teatrooficinadoestudante.com.br',
  'portalhortolandia.com.br',
  'hortolandia.sp.gov.br',
  'ribeiraopreto.sp.gov.br',
  'revide.com.br',
  'ribeiraoshopping.com.br',
  'riopreto.sp.gov.br',
  'diariodaregiao.com.br',
  'jcnet.com.br',
  'bauru.sp.gov.br',
  'sorocaba.sp.gov.br',
  'jornalcruzeiro.com.br',
  'jundiai.sp.gov.br',
  'piracicaba.sp.gov.br',
  'jornaldepiracicaba.com.br',
  'saocarlosagora.com.br',
  'promemoria.saocarlos.sp.gov.br',
  'araraquara.com.br',
  'araraquara.sp.gov.br',
  'gcn.net.br',
  'marilianoticia.com.br',
  'ifronteira.com',
  'soubh.com.br',
  'correiodeuberlandia.com.br',
  'zinecultural.com',
  'curitibacult.com.br',
  'guiacuritiba.com.br',
  'londrina.pr.gov.br',
  'maringapost.com.br',
  'floripamilgrau.com.br',
  'guiafloripa.com.br',
  'ocp.news',
  'agendapoa.com.br',
  'poacultural.com',
  'clicrbs.com.br',
  'curtamais.com.br',
  'goiania.go.gov.br',
  'aloalobahia.com',
  'salvadordabahia.com',
  'visit.recife.br',
  'leiaja.com',
  'fortaleza24h.com.br',
  'opovo.com.br',
  'americana.sp.gov.br',
  'indaiatuba.sp.gov.br',
  'sumare.sp.gov.br',
  'paulinia.sp.gov.br',
  'valinhos.sp.gov.br',
  'vinhedo.sp.gov.br',
  'jaguariuna.sp.gov.br',
  'itatiba.sp.gov.br',
  'novaodessa.sp.gov.br',
  'santabarbara.sp.gov.br',
];

export function isVerifiedDeepLink(url?: string): boolean {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  const lower = url.toLowerCase();
  
  if (
    lower.includes('exemplo') ||
    lower.includes('sample') ||
    lower.includes('link_ia') ||
    lower.includes('vaice.app') ||
    lower.includes('disco-') ||
    lower.includes('url-original') ||
    lower.includes('mapacultural.local') ||
    lower.includes('undefined') ||
    lower.includes('null') ||
    lower.includes('localhost')
  ) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase().replace(/\/$/, '');

    // Generic homepages/sections are not deep links
    if (!pathname || pathname === '/' || pathname === '/agenda' || pathname === '/cultura') {
      return false;
    }

    return VERIFIED_EVENT_DOMAINS.some(d => domain.includes(d));
  } catch {
    return false;
  }
}

export function getGoogleSearchUrl(event: { title: string; cityRegion?: string }): string {
  const query = `${event.title || ''} ${event.cityRegion || ''} evento cultural`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function getSymplaSearchUrl(event: { title: string }): string {
  return `https://www.sympla.com.br/busca/${encodeURIComponent(event.title || '')}`;
}

export function getWorkingEventUrl(event: { title: string; cityRegion: string; sourceUrl?: string; organizer?: string }): string {
  const url = event.sourceUrl;
  
  if (isVerifiedDeepLink(url)) {
    return url!;
  }

  // Fallback to Google Search for the exact event title and city so the user always lands on real content
  return getGoogleSearchUrl(event);
}

export function getInstagramSearchUrl(event: { title: string; cityRegion: string }): string {
  const query = `${event.title || ''} ${event.cityRegion || ''}`.trim();
  return `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/\s+/g, ''))}/`;
}

