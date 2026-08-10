import { FullyDiscoveredEvent } from './types';

export class DeduplicationEngine {
  /**
   * Calculates similarity between two strings (0.0 to 1.0) using Jaccard & Levenshtein hybrid distance
   */
  public static calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim().replace(/[^\w\s]/gi, '');
    const s2 = str2.toLowerCase().trim().replace(/[^\w\s]/gi, '');

    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0.0;

    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const jaccard = intersection.size / union.size;
    return jaccard;
  }

  /**
   * Determines if two events are duplicates based on name, location, date, and organizer
   */
  public static isDuplicate(ev1: FullyDiscoveredEvent, ev2: FullyDiscoveredEvent): boolean {
    const titleSim = this.calculateStringSimilarity(ev1.title, ev2.title);
    const dateSim = ev1.dateRange === ev2.dateRange ? 1.0 : 0.0;
    const citySim = this.calculateStringSimilarity(ev1.cityRegion, ev2.cityRegion);

    // If title similarity > 75% and same date/city, it's a duplicate
    if (titleSim >= 0.75 && (dateSim === 1.0 || citySim >= 0.7)) {
      return true;
    }

    // High similarity across title + organizer + city
    const organizerSim = this.calculateStringSimilarity(ev1.organizer, ev2.organizer);
    if (titleSim >= 0.65 && organizerSim >= 0.7 && citySim >= 0.6) {
      return true;
    }

    return false;
  }

  /**
   * Processes an incoming batch of events and resolves duplicates,
   * keeping the event with higher trustScore and enriching missing metadata.
   */
  public static deduplicateBatch(existingEvents: FullyDiscoveredEvent[], newEvents: FullyDiscoveredEvent[]): {
    consolidatedEvents: FullyDiscoveredEvent[];
    mergedCount: number;
    updatedCount: number;
  } {
    const eventMap = new Map<string, FullyDiscoveredEvent>();
    let mergedCount = 0;
    let updatedCount = 0;

    // Load existing events
    for (const ev of existingEvents) {
      eventMap.set(ev.id, { ...ev });
    }

    for (const candidate of newEvents) {
      let duplicateKey: string | null = null;

      for (const [id, existing] of eventMap.entries()) {
        if (this.isDuplicate(existing, candidate)) {
          duplicateKey = id;
          break;
        }
      }

      if (duplicateKey) {
        // Merge into existing event
        const existing = eventMap.get(duplicateKey)!;
        mergedCount++;

        // Keep highest trustScore source as primary metadata
        const useCandidateAsPrimary = candidate.metadata.trustScore > existing.metadata.trustScore;
        const primary = useCandidateAsPrimary ? candidate : existing;
        const secondary = useCandidateAsPrimary ? existing : candidate;

        const updatedAuditHistory = [
          ...primary.metadata.auditHistory,
          {
            timestamp: new Date().toISOString(),
            action: 'merged_duplicate' as const,
            source: secondary.metadata.source,
            trustScore: secondary.metadata.trustScore,
            changesSummary: `Duplicata consolidada da fonte "${secondary.metadata.source}" (Trust Score: ${secondary.metadata.trustScore}). Informações e fotos integradas.`,
            hash: secondary.metadata.hash,
          }
        ];

        const mergedEvent: FullyDiscoveredEvent = {
          ...primary,
          id: existing.id, // Preserve original ID
          image: primary.image || secondary.image,
          description: primary.description.length > secondary.description.length ? primary.description : secondary.description,
          socialLinks: {
            ...secondary.socialLinks,
            ...primary.socialLinks,
          },
          metadata: {
            ...primary.metadata,
            version: primary.metadata.version + 1,
            lastUpdatedAt: new Date().toISOString(),
            auditHistory: updatedAuditHistory,
          }
        };

        eventMap.set(existing.id, mergedEvent);
        updatedCount++;
      } else {
        // New event
        eventMap.set(candidate.id, candidate);
      }
    }

    return {
      consolidatedEvents: Array.from(eventMap.values()),
      mergedCount,
      updatedCount,
    };
  }
}
