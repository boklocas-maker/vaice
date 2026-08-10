export type ProviderType = 'api' | 'rss' | 'schema_html' | 'scrape' | 'auto_discovered';

export type EventStatus = 'active' | 'ended' | 'cancelled';

export interface EventTrustScore {
  score: number; // 0-100
  label: string; // e.g. "Site Oficial", "API Oficial", "Prefeitura", "Universidade", "Empresa Organizadora", "Portal Conhecido", "Blog", "Fonte Desconhecida"
  categoryRating: 'MAXIMA' | 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface AggregatorProviderConfig {
  id: string;
  name: string;
  description: string;
  type: ProviderType;
  categoryGroup?: 'ticketing' | 'institutional' | 'public' | 'venues' | 'open_spec' | 'auto_discovered';
  trustScore: number;
  enabled: boolean;
  rateLimitMs: number;
  lastRunAt?: string;
  lastETag?: string;
  lastHash?: string;
  totalEventsFound: number;
  errorCount: number;
  url?: string;
  autoDiscoveredKeyword?: string;
}

export interface RawScrapedItem {
  providerId: string;
  sourceUrl: string;
  rawTextOrHtml: string;
  rawJson?: any;
  eTag?: string;
  fetchedAt: string;
}

export interface AiEnrichedData {
  shortSummary: string;
  longSummary: string;
  keywords: string[];
  tags: string[];
  popularityScore: number; // 0 - 100
  targetAudience: string;
  durationEstimated: string;
  priceEstimated: string;
  userRecommendation: string;
  ageRating: string;
  capacity?: number;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: 'created' | 'updated' | 'cancelled' | 'merged_duplicate';
  source: string;
  trustScore: number;
  changesSummary: string;
  hash: string;
}

export interface AggregatedEventMetadata {
  lastUpdatedAt: string;
  firstDiscoveredAt: string;
  source: string;
  providerId: string;
  trustScore: number;
  hash: string;
  version: number;
  status: EventStatus;
  auditHistory: AuditTrailEntry[];
  validationStatus: {
    linkValid: boolean;
    imageValid: boolean;
    coordinatesValid: boolean;
    dateValid: boolean;
  };
}

export interface FullyDiscoveredEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  cityRegion: string;
  address: string;
  cep?: string;
  lat: number;
  lng: number;
  dateRange: string;
  timeRange: string;
  isVirtual: boolean;
  virtualLink?: string;
  isPaid: boolean;
  price: string;
  image: string;
  organizer: string;
  officialLink: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  aiEnrichment: AiEnrichedData;
  metadata: AggregatedEventMetadata;
}

export interface AggregatorLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  providerId?: string;
  message: string;
  batchSummary?: {
    totalAnalyzed: number;
    duplicates: number;
    newEvents: number;
    updatedEvents: number;
    durationFormatted: string;
    breakdown: { providerName: string; count: number }[];
  };
}

export interface ProviderTypeCounts {
  api: number;
  rss: number;
  schemaOrg: number;
  htmlIa: number;
  autoDiscovered: number;
}

export interface AggregatorMetrics {
  totalDiscovered: number;
  totalActive: number;
  newToday: number;
  updatedToday: number;
  totalCancelled: number;
  duplicatesResolved: number;
  totalSources: number;
  providerTypeCounts: ProviderTypeCounts;
  averageTrustScore: number;
  lastScanDurationMs: number;
  lastScanDurationFormatted: string;
  lastScanTimestamp: string;
  schedulerFrequency: '1h' | '24h' | '7d' | 'paused';
  schedulerActive: boolean;
  autoDiscoveryKeywords: string[];
  newDomainsDiscoveredToday: number;
  queueConcurrency: number;
  pagesScrapedLastScan: number;
}

