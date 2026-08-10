export class GeocodingService {
  private static knownCities: Record<string, { lat: number; lng: number }> = {
    // Capitais
    'teresina': { lat: -5.0920, lng: -42.8038 },
    'são luís': { lat: -2.5307, lng: -44.3068 },
    'sao luis': { lat: -2.5307, lng: -44.3068 },
    'fortaleza': { lat: -3.7172, lng: -38.5433 },
    'natal': { lat: -5.7945, lng: -35.2110 },
    'joão pessoa': { lat: -7.1195, lng: -34.8450 },
    'joao pessoa': { lat: -7.1195, lng: -34.8450 },
    'recife': { lat: -8.0476, lng: -34.8770 },
    'maceió': { lat: -9.6658, lng: -35.7350 },
    'maceio': { lat: -9.6658, lng: -35.7350 },
    'aracaju': { lat: -10.9472, lng: -37.0731 },
    'salvador': { lat: -12.9777, lng: -38.5016 },
    'manaus': { lat: -3.1190, lng: -60.0217 },
    'belém': { lat: -1.4558, lng: -48.4902 },
    'belem': { lat: -1.4558, lng: -48.4902 },
    'brasília': { lat: -15.7975, lng: -47.8919 },
    'brasilia': { lat: -15.7975, lng: -47.8919 },
    'goiânia': { lat: -16.6809, lng: -49.2565 },
    'goiania': { lat: -16.6809, lng: -49.2565 },
    'cuiabá': { lat: -15.6010, lng: -56.0979 },
    'cuiaba': { lat: -15.6010, lng: -56.0979 },
    'campo grande': { lat: -20.4697, lng: -54.6201 },
    'belo horizonte': { lat: -19.9167, lng: -43.9345 },
    'vitória': { lat: -20.3155, lng: -40.3128 },
    'vitoria': { lat: -20.3155, lng: -40.3128 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
    'são paulo': { lat: -23.5505, lng: -46.6333 },
    'sao paulo': { lat: -23.5505, lng: -46.6333 },
    'curitiba': { lat: -25.4284, lng: -49.2733 },
    'florianópolis': { lat: -27.5949, lng: -48.5480 },
    'florianopolis': { lat: -27.5949, lng: -48.5480 },
    'porto alegre': { lat: -30.0346, lng: -51.2177 },

    // RMC e Interior de SP
    'campinas': { lat: -22.9068, lng: -47.0614 },
    'hortolândia': { lat: -22.8604, lng: -47.1655 },
    'hortolandia': { lat: -22.8604, lng: -47.1655 },
    'sumaré': { lat: -22.8219, lng: -47.2667 },
    'sumare': { lat: -22.8219, lng: -47.2667 },
    'americana': { lat: -22.7394, lng: -47.3314 },
    'indaiatuba': { lat: -23.0903, lng: -47.2181 },
    'valinhos': { lat: -22.9708, lng: -46.9961 },
    'vinhedo': { lat: -23.0296, lng: -46.9744 },
    'jundiaí': { lat: -23.1857, lng: -46.8892 },
    'jundiai': { lat: -23.1857, lng: -46.8892 },
    'itatiba': { lat: -23.0058, lng: -46.8388 },
    'limeira': { lat: -22.5647, lng: -47.4017 },
    'piracicaba': { lat: -22.7253, lng: -47.6492 },
    'rio claro': { lat: -22.4103, lng: -47.5606 },
    'sorocaba': { lat: -23.5015, lng: -47.4526 },
    'santos': { lat: -23.9608, lng: -46.3339 },
    'são josé dos campos': { lat: -23.1896, lng: -45.8841 },
    'sao jose dos campos': { lat: -23.1896, lng: -45.8841 },
    'ribeirão preto': { lat: -21.1704, lng: -47.8103 },
    'ribeirao preto': { lat: -21.1704, lng: -47.8103 },
    'bauru': { lat: -22.3147, lng: -49.0606 },
    'araraquara': { lat: -21.7946, lng: -48.1756 },
    'são carlos': { lat: -22.0175, lng: -47.8908 },
    'sao carlos': { lat: -22.0175, lng: -47.8908 },
    'franca': { lat: -20.5386, lng: -47.4008 },
    'são josé do rio preto': { lat: -20.8113, lng: -49.3758 },
    'sao jose do rio preto': { lat: -20.8113, lng: -49.3758 },
    'taubaté': { lat: -23.0264, lng: -45.5552 },
    'taubate': { lat: -23.0264, lng: -45.5552 },
    'guarulhos': { lat: -23.4542, lng: -46.5337 },
    'santo andré': { lat: -23.6639, lng: -46.5383 },
    'santo andre': { lat: -23.6639, lng: -46.5383 },
    'são bernardo': { lat: -23.6944, lng: -46.5654 },
    'sao bernardo': { lat: -23.6944, lng: -46.5654 },
    'osasco': { lat: -23.5325, lng: -46.7917 },
    'barueri': { lat: -23.5112, lng: -46.8761 },
  };

  private static landmarkOverrides: Array<{ keywords: string[]; lat: number; lng: number }> = [
    // Campinas
    { keywords: ['parque taquaral', 'taquaral', 'lagoa do taquaral'], lat: -22.8758, lng: -47.0512 },
    { keywords: ['cambuí', 'cambui', 'praça imprensa fluminense'], lat: -22.8993, lng: -47.0617 },
    { keywords: ['barão geraldo', 'barao geraldo', 'unicamp', 'instituto de artes unicamp'], lat: -22.8185, lng: -47.0900 },
    { keywords: ['vila itapura', 'itapura', 'galeria estação', 'galeria estacao'], lat: -22.8935, lng: -47.0580 },
    { keywords: ['sesc bonfim', 'rua do bonfim'], lat: -22.9040, lng: -47.0780 },
    { keywords: ['estação cultura', 'estacao cultura'], lat: -22.9080, lng: -47.0670 },
    { keywords: ['teatro castro mendes', 'teatro municipal castro mendes', 'vila industrial'], lat: -22.9133, lng: -47.0723 },
    { keywords: ['bosque dos jequitibás', 'bosque dos jequitibas'], lat: -22.9090, lng: -47.0520 },
    { keywords: ['centro de convivência', 'centro de convivencia'], lat: -22.8985, lng: -47.0570 },
    { keywords: ['macc', 'museu de arte contemporânea de campinas', 'praça bento quirino'], lat: -22.9054, lng: -47.0615 },
    
    // São Paulo
    { keywords: ['sala são paulo', 'sala sao paulo'], lat: -23.5350, lng: -46.6389 },
    { keywords: ['sesc avenida paulista', 'sesc paulista', 'avenida paulista'], lat: -23.5707, lng: -46.6475 },
    { keywords: ['parque ibirapuera', 'auditório ibirapuera', 'auditorio ibirapuera'], lat: -23.5874, lng: -46.6576 },
    { keywords: ['theatro municipal de são paulo', 'theatro municipal de sao paulo'], lat: -23.5453, lng: -46.6386 },
    
    // Rio de Janeiro
    { keywords: ['parque das ruínas', 'parque das ruinas', 'santa teresa'], lat: -22.9168, lng: -43.1818 },
    { keywords: ['sesc copacabana'], lat: -22.9733, lng: -43.1880 },
    { keywords: ['largo da carioca'], lat: -22.9062, lng: -43.1786 },
    
    // Belo Horizonte
    { keywords: ['praça da liberdade', 'praca da liberdade'], lat: -19.9323, lng: -43.9378 },
    { keywords: ['minascentro'], lat: -19.9213, lng: -43.9423 },
    
    // Teresina
    { keywords: ['theatro 4 de setembro', 'praça pedro ii', 'praca pedro ii'], lat: -5.0911, lng: -42.8122 },
    { keywords: ['mercado cultural euclides da cunha'], lat: -5.0880, lng: -42.8090 },
  ];

  public static geocodeAddress(address: string, cityRegion: string): { lat: number; lng: number; isValid: boolean } {
    const combined = `${address || ''} ${cityRegion || ''}`.toLowerCase().trim();

    // 1. Check precise landmark overrides first for exact venue pin positioning
    for (const landmark of this.landmarkOverrides) {
      if (landmark.keywords.some((kw) => combined.includes(kw))) {
        return { lat: landmark.lat, lng: landmark.lng, isValid: true };
      }
    }

    // 2. Match explicit city names (sorted longest first)
    const sortedCities = Object.entries(this.knownCities).sort((a, b) => b[0].length - a[0].length);

    for (const [cityName, coords] of sortedCities) {
      if (combined.includes(cityName)) {
        return { lat: coords.lat, lng: coords.lng, isValid: true };
      }
    }

    // 2. Check state acronyms if no city name matched directly
    const stateMap: Record<string, { lat: number; lng: number }> = {
      'pi': { lat: -5.0920, lng: -42.8038 }, // Teresina
      'rj': { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
      'mg': { lat: -19.9167, lng: -43.9345 }, // Belo Horizonte
      'ba': { lat: -12.9777, lng: -38.5016 }, // Salvador
      'pe': { lat: -8.0476, lng: -34.8770 }, // Recife
      'ce': { lat: -3.7172, lng: -38.5433 }, // Fortaleza
      'df': { lat: -15.7975, lng: -47.8919 }, // Brasília
      'pr': { lat: -25.4284, lng: -49.2733 }, // Curitiba
      'rs': { lat: -30.0346, lng: -51.2177 }, // Porto Alegre
      'sc': { lat: -27.5949, lng: -48.5480 }, // Florianópolis
      'go': { lat: -16.6809, lng: -49.2565 }, // Goiânia
      'es': { lat: -20.3155, lng: -40.3128 }, // Vitória
      'am': { lat: -3.1190, lng: -60.0217 }, // Manaus
      'pa': { lat: -1.4558, lng: -48.4902 }, // Belém
      'ms': { lat: -20.4697, lng: -54.6201 }, // Campo Grande
      'mt': { lat: -15.6010, lng: -56.0979 }, // Cuiabá
      'al': { lat: -9.6658, lng: -35.7350 }, // Maceió
      'rn': { lat: -5.7945, lng: -35.2110 }, // Natal
      'pb': { lat: -7.1195, lng: -34.8450 }, // João Pessoa
      'se': { lat: -10.9472, lng: -37.0731 }, // Aracaju
      'ma': { lat: -2.5307, lng: -44.3068 }, // São Luís
    };

    const stateMatch = combined.match(/(?:-\s*|\s+)([a-z]{2})(?:\s+|$)/i);
    if (stateMatch) {
      const st = stateMatch[1].toLowerCase();
      if (stateMap[st]) {
        return { lat: stateMap[st].lat, lng: stateMap[st].lng, isValid: true };
      }
    }

    // 3. Default fallback to Campinas base (-22.9068, -47.0614)
    return { lat: -22.9068, lng: -47.0614, isValid: true };
  }

  /**
   * Applies a tiny micro-dispersion (10m - 30m max) to coordinates based on string input
   * so events at identical venues don't completely overlap on Leaflet map markers.
   */
  public static jitterCoordinates(lat: number, lng: number, seedKey: string, index: number = 0): { lat: number; lng: number } {
    let hash = 0;
    for (let i = 0; i < seedKey.length; i++) {
      hash = (hash << 5) - hash + seedKey.charCodeAt(i);
      hash |= 0;
    }
    const angle = ((Math.abs(hash) + index * 137) % 360) * (Math.PI / 180);
    // Micro radius: 0.0001 to 0.0003 degrees (~10m to 30m)
    const radius = 0.0001 + ((Math.abs(hash * 13) % 20) / 100000);
    
    return {
      lat: Number((lat + Math.cos(angle) * radius).toFixed(6)),
      lng: Number((lng + Math.sin(angle) * radius).toFixed(6)),
    };
  }
}

