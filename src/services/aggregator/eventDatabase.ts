import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

export type SavedCrawlSource = {
  uri: string;
  title: string;
};

export type SavedCrawlEvent = {
  title: string;
  category: string;
  description: string;
  address: string;
  cityRegion: string;
  dateRange: string;
  isVirtual: boolean;
  isPaid: boolean;
  price: string;
  organizer: string;
  sourceUrl: string;
  sourceTitle?: string;
  externalId?: string;
  fonte?: string;
  ultimaVerificacao?: string;
  persistedAt?: string;
};

type SavedEventRow = {
  id?: number;
  title: string;
  category: string;
  description: string;
  address: string;
  city_region: string;
  date_range: string;
  is_virtual: number;
  is_paid: number;
  price: string;
  organizer: string;
  source_url: string;
  source_title: string | null;
  external_id: string | null;
  fonte: string | null;
  dedup_hash: string | null;
  ultima_verificacao: string | null;
  payload_json: string;
  updated_at: string;
};

type SavedCrawlRow = {
  id: number;
  query_key: string;
  query_label: string;
  engine: string;
  model_name: string;
  source_kind: string;
  sources_json: string;
  result_count: number;
  created_at: string;
};

function normalizeQueryKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueEvents(events: SavedCrawlEvent[]): SavedCrawlEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = event.sourceUrl || `${event.title}|${event.dateRange}|${event.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeForComparison(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class EventDatabase {
  private db: DatabaseSync;

  constructor(dbPath = path.join(process.cwd(), "data", "events.sqlite")) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS crawls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_key TEXT NOT NULL,
        query_label TEXT NOT NULL,
        engine TEXT NOT NULL,
        model_name TEXT NOT NULL,
        source_kind TEXT NOT NULL,
        sources_json TEXT NOT NULL,
        result_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS saved_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crawl_id INTEGER NOT NULL,
        query_key TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        city_region TEXT NOT NULL,
        date_range TEXT NOT NULL,
        is_virtual INTEGER NOT NULL,
        is_paid INTEGER NOT NULL,
        price TEXT NOT NULL,
        organizer TEXT NOT NULL,
        source_url TEXT NOT NULL UNIQUE,
        source_title TEXT,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (crawl_id) REFERENCES crawls(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_saved_events_query_key_updated_at
        ON saved_events(query_key, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_events_crawl_id
        ON saved_events(crawl_id);
    `);

    this.ensureColumns();
  }

  private ensureColumns(): void {
    const columns = this.db.prepare("PRAGMA table_info(saved_events)").all() as {
      name: string;
    }[];
    const colNames = new Set(columns.map((c) => c.name));

    const addColumn = (name: string, defn: string) => {
      if (!colNames.has(name)) {
        this.db.exec(`ALTER TABLE saved_events ADD COLUMN ${name} ${defn}`);
      }
    };

    addColumn("external_id", "TEXT");
    addColumn("fonte", "TEXT");
    addColumn("dedup_hash", "TEXT");
    addColumn("ultima_verificacao", "TEXT");

    this.db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_events_fonte_ext_id
        ON saved_events(fonte, external_id)
        WHERE external_id IS NOT NULL AND fonte IS NOT NULL
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_saved_events_dedup_hash
        ON saved_events(dedup_hash)
    `);
  }

  public static computeDedupHash(
    title: string,
    dateRange: string,
    address: string,
  ): string {
    const normalized = [
      normalizeForComparison(title),
      normalizeForComparison(dateRange),
      normalizeForComparison(address),
    ]
      .filter(Boolean)
      .join("|");

    if (!normalized) return "";

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash << 5) - hash + normalized.charCodeAt(i);
      hash |= 0;
    }
    return `d${Math.abs(hash).toString(16)}`;
  }

  public findExistingEventId(params: {
    externalId?: string;
    fonte?: string;
    sourceUrl?: string;
    dedupHash?: string;
  }): number | null {
    if (params.externalId && params.fonte) {
      const row = this.db
        .prepare(
          `SELECT id FROM saved_events WHERE fonte = ? AND external_id = ? LIMIT 1`,
        )
        .get(params.fonte, params.externalId) as { id: number } | undefined;
      if (row) return Number(row.id);
    }

    if (params.sourceUrl) {
      const row = this.db
        .prepare(`SELECT id FROM saved_events WHERE source_url = ? LIMIT 1`)
        .get(params.sourceUrl) as { id: number } | undefined;
      if (row) return Number(row.id);
    }

    if (params.dedupHash) {
      const row = this.db
        .prepare(`SELECT id FROM saved_events WHERE dedup_hash = ? LIMIT 1`)
        .get(params.dedupHash) as { id: number } | undefined;
      if (row) return Number(row.id);
    }

    return null;
  }

  public saveCrawlBatch(params: {
    queryKey: string;
    queryLabel: string;
    engine: string;
    modelName: string;
    sourceKind: string;
    sources: SavedCrawlSource[];
    events: SavedCrawlEvent[];
  }): {
    crawlId: number;
    events: SavedCrawlEvent[];
    newCount: number;
    updatedCount: number;
    duplicateCount: number;
  } {
    const queryKey = normalizeQueryKey(params.queryKey);
    const nowIso = new Date().toISOString();
    const events = uniqueEvents(params.events);

    const insertCrawl = this.db.prepare(`
      INSERT INTO crawls (query_key, query_label, engine, model_name, source_kind, sources_json, result_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEvent = this.db.prepare(`
      INSERT INTO saved_events (
        crawl_id, query_key, title, category, description, address, city_region,
        date_range, is_virtual, is_paid, price, organizer, source_url, source_title,
        external_id, fonte, dedup_hash, ultima_verificacao,
        payload_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateEvent = this.db.prepare(`
      UPDATE saved_events SET
        crawl_id = ?,
        query_key = ?,
        title = ?,
        category = ?,
        description = ?,
        address = ?,
        city_region = ?,
        date_range = ?,
        is_virtual = ?,
        is_paid = ?,
        price = ?,
        organizer = ?,
        source_title = ?,
        external_id = COALESCE(?, external_id),
        fonte = COALESCE(?, fonte),
        dedup_hash = COALESCE(?, dedup_hash),
        ultima_verificacao = ?,
        payload_json = ?,
        updated_at = ?
      WHERE id = ?
    `);

    this.db.exec("BEGIN IMMEDIATE TRANSACTION");
    try {
      const crawlResult = insertCrawl.run(
        queryKey,
        params.queryLabel,
        params.engine,
        params.modelName,
        params.sourceKind,
        JSON.stringify(params.sources),
        events.length,
        nowIso,
      );
      const crawlId = Number(crawlResult.lastInsertRowid);

      let newCount = 0;
      let updatedCount = 0;
      let duplicateCount = 0;

      for (const event of events) {
        const dedupHash = EventDatabase.computeDedupHash(
          event.title,
          event.dateRange,
          event.address,
        );

        const existingId = this.findExistingEventId({
          externalId: event.externalId,
          fonte: event.fonte,
          sourceUrl: event.sourceUrl,
          dedupHash,
        });

        const payload = {
          ...event,
          dedupHash,
          persistedAt: nowIso,
          ultimaVerificacao: nowIso,
        };

        if (existingId) {
          updateEvent.run(
            crawlId,
            queryKey,
            event.title,
            event.category,
            event.description,
            event.address,
            event.cityRegion,
            event.dateRange,
            event.isVirtual ? 1 : 0,
            event.isPaid ? 1 : 0,
            event.price,
            event.organizer,
            event.sourceTitle || null,
            event.externalId || null,
            event.fonte || null,
            dedupHash || null,
            nowIso,
            JSON.stringify(payload),
            nowIso,
            existingId,
          );
          updatedCount++;
        } else {
          insertEvent.run(
            crawlId,
            queryKey,
            event.title,
            event.category,
            event.description,
            event.address,
            event.cityRegion,
            event.dateRange,
            event.isVirtual ? 1 : 0,
            event.isPaid ? 1 : 0,
            event.price,
            event.organizer,
            event.sourceUrl,
            event.sourceTitle || null,
            event.externalId || null,
            event.fonte || null,
            dedupHash || null,
            nowIso,
            JSON.stringify(payload),
            nowIso,
            nowIso,
          );
          newCount++;
        }
      }

      this.db.exec("COMMIT");
      return {
        crawlId,
        events: events.map((event) => ({
          ...event,
          persistedAt: nowIso,
          ultimaVerificacao: nowIso,
        })),
        newCount,
        updatedCount,
        duplicateCount,
      };
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  public countSavedEvents(): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM saved_events`)
      .get() as { count: number };
    return Number(row?.count || 0);
  }

  public countSavedCrawls(): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM crawls`)
      .get() as { count: number };
    return Number(row?.count || 0);
  }

  public getRecentEvents(queryKey: string, maxAgeMs: number): SavedCrawlEvent[] {
    const normalizedKey = normalizeQueryKey(queryKey);
    const cutoffIso = new Date(Date.now() - maxAgeMs).toISOString();

    const rows = this.db
      .prepare(
        `
        SELECT e.*
        FROM saved_events e
        JOIN crawls c ON c.id = e.crawl_id
        WHERE e.query_key = ? AND c.created_at >= ?
        ORDER BY c.created_at DESC, e.id DESC
      `,
      )
      .all(normalizedKey, cutoffIso) as SavedEventRow[];

    return rows.map((row) => this.rowToEvent(row));
  }

  public listSavedEvents(limit = 100): SavedCrawlEvent[] {
    const rows = this.db
      .prepare(
        `
        SELECT e.*
        FROM saved_events e
        ORDER BY e.updated_at DESC, e.id DESC
        LIMIT ?
      `,
      )
      .all(limit) as SavedEventRow[];

    return rows.map((row) => this.rowToEvent(row));
  }

  public getRecentCrawls(limit = 20): SavedCrawlRow[] {
    return this.db
      .prepare(
        `
        SELECT *
        FROM crawls
        ORDER BY created_at DESC, id DESC
        LIMIT ?
      `,
      )
      .all(limit) as SavedCrawlRow[];
  }

  private rowToEvent(row: SavedEventRow): SavedCrawlEvent {
    const persisted = this.safeParse(row.payload_json);
    return {
      title: persisted.title || row.title,
      category: persisted.category || row.category,
      description: persisted.description || row.description,
      address: persisted.address || row.address,
      cityRegion: persisted.cityRegion || row.city_region,
      dateRange: persisted.dateRange || row.date_range,
      isVirtual: persisted.isVirtual ?? Boolean(row.is_virtual),
      isPaid: persisted.isPaid ?? Boolean(row.is_paid),
      price: persisted.price || row.price,
      organizer: persisted.organizer || row.organizer,
      sourceUrl: persisted.sourceUrl || row.source_url,
      sourceTitle: persisted.sourceTitle || row.source_title || undefined,
      externalId: persisted.externalId || row.external_id || undefined,
      fonte: persisted.fonte || row.fonte || undefined,
      ultimaVerificacao:
        persisted.ultimaVerificacao || row.ultima_verificacao || undefined,
      persistedAt: persisted.persistedAt || row.updated_at,
    };
  }

  public clearAllEvents(): void {
    try {
      this.db.exec("DELETE FROM saved_events; DELETE FROM crawls;");
    } catch (e) {
      console.error("Error clearing database events:", e);
    }
  }

  private safeParse(payloadJson: string): Partial<SavedCrawlEvent> {
    try {
      return JSON.parse(payloadJson);
    } catch {
      return {};
    }
  }
}
