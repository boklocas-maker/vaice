import React, { useState, useEffect } from 'react';
import { CulturalEvent, AccessibilitySettings, UserProfile } from './types';

import { getDistanceKm, getEstimatedTravelTimeMinutes } from './utils/distance';
import { normalizeCategory, isCategoryMatch } from './utils/categoryUtils';
import { getEventImage } from './utils/imageUtils';
import { Header, ViewType } from './components/Header';
import { InteractiveMap } from './components/InteractiveMap';
import { EventDrawer } from './components/EventDrawer';
import { CalendarView } from './components/CalendarView';
import { SavedEventsView } from './components/SavedEventsView';
import { AccessibilityView } from './components/AccessibilityView';
import { CreateEventView } from './components/CreateEventView';
import { AnalyticsDataView } from './components/AnalyticsDataView';
import { DiscoveryAdminView } from './components/DiscoveryAdminView';
import { LandingHeroView } from './components/LandingHeroView';
import { FilterModal } from './components/FilterModal';
import { LoginModal } from './components/LoginModal';
import { EventQuizModal } from './components/EventQuizModal';
import { GeocodingService } from './services/aggregator/geocodingService';
import { buildFallbackEvents } from './data/mockEvents';
import { isEventPast } from './utils/dateUtils';
import { Sparkles, PlusCircle } from 'lucide-react';
import { 
  subscribeFirestoreEvents, 
  createFirestoreEvent, 
  addFirestoreReview, 
  saveFirestoreUserProfile,
  clearAllFirestoreEvents 
} from './services/firebaseEventsService';

export default function App() {
  const getInitialView = (): ViewType => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (search.includes('view=admin') || pathname.includes('/admin') || hash.includes('admin')) {
        return 'admin';
      }
    }
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<ViewType>(getInitialView);

  // Sync currentView with URL query parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentView === 'admin') {
      const newUrl = `${window.location.pathname}?view=admin`;
      window.history.replaceState(null, '', newUrl);
    } else if (window.location.search.includes('view=admin')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [currentView]);

  // Listen for browser navigation / popstate
  useEffect(() => {
    const handlePopState = () => {
      const search = window.location.search;
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (search.includes('view=admin') || pathname.includes('/admin') || hash.includes('admin')) {
        setCurrentView('admin');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getLocalCreatedEvents = (): CulturalEvent[] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cultural_map_user_created_events');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error('Error reading local created events:', e);
      }
    }
    return [];
  };

  const [events, setEvents] = useState<CulturalEvent[]>(() => {
    return getLocalCreatedEvents();
  });
  const [selectedEvent, setSelectedEvent] = useState<CulturalEvent | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // User Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Route calculation state
  const [activeRouteEvent, setActiveRouteEvent] = useState<CulturalEvent | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas as categorias');
  const [maxDistanceKm, setMaxDistanceKm] = useState(5000);
  const [formatFilter, setFormatFilter] = useState<'all' | 'presencial' | 'virtual'>('all');
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [happeningNowOnly, setHappeningNowOnly] = useState(false);

  // Modals
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalReason, setLoginModalReason] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizFilterIds, setQuizFilterIds] = useState<string[] | null>(null);

  // Helper for per-account storage key
  const getAccountKey = (email: string) => `cultural_user_account_${email.toLowerCase().trim()}`;

  // User Profile with localStorage Persistence (Account-based)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cultural_map_user_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            const email = parsed.email ? parsed.email.toLowerCase().trim() : '';
            let savedEventIds = Array.isArray(parsed.savedEventIds) ? parsed.savedEventIds : [];
            let participatedEventIds = Array.isArray(parsed.participatedEventIds) ? parsed.participatedEventIds : [];
            let reminders = Array.isArray(parsed.reminders) ? parsed.reminders : [];
            let userReviews = Array.isArray(parsed.userReviews) ? parsed.userReviews : [];
            let name = parsed.name || 'Visitante';

            // If logged in, sync/load from account-specific storage
            if (parsed.isLoggedIn && email) {
              const accountKey = getAccountKey(email);
              const accountStored = localStorage.getItem(accountKey);
              if (accountStored) {
                const accountParsed = JSON.parse(accountStored);
                if (accountParsed && typeof accountParsed === 'object') {
                  name = accountParsed.name || name;
                  const accountSaved = Array.isArray(accountParsed.savedEventIds) ? accountParsed.savedEventIds : [];
                  const accountParticipated = Array.isArray(accountParsed.participatedEventIds) ? accountParsed.participatedEventIds : [];
                  savedEventIds = Array.from(new Set([...accountSaved, ...savedEventIds]));
                  participatedEventIds = Array.from(new Set([...accountParticipated, ...participatedEventIds]));
                  if (Array.isArray(accountParsed.reminders) && accountParsed.reminders.length > 0) {
                    reminders = accountParsed.reminders;
                  }
                  if (Array.isArray(accountParsed.userReviews) && accountParsed.userReviews.length > 0) {
                    userReviews = accountParsed.userReviews;
                  }
                }
              }
            }

            return {
              isLoggedIn: Boolean(parsed.isLoggedIn),
              name,
              email,
              savedEventIds,
              participatedEventIds,
              reminders,
              userReviews,
            };
          }
        }
      } catch (e) {
        console.error('Error loading stored user profile:', e);
      }
    }
    return {
      isLoggedIn: false,
      name: 'Visitante',
      email: '',
      savedEventIds: [],
      participatedEventIds: [],
      reminders: [],
      userReviews: [],
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cultural_map_user_profile', JSON.stringify(userProfile));
        if (userProfile.isLoggedIn && userProfile.email) {
          const accountKey = getAccountKey(userProfile.email);
          localStorage.setItem(accountKey, JSON.stringify(userProfile));
          saveFirestoreUserProfile(accountKey, userProfile).catch((e) =>
            console.error('Error saving user profile to Firestore:', e)
          );
        }
      } catch (e) {
        console.error('Error persisting user profile:', e);
      }
    }
  }, [userProfile]);

  // Accessibility Settings
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 'padrao',
    textSpacing: 'normal',
    dyslexiaFont: false,
    daltonismFilter: 'off',
    highContrast: false,
    reduceAnimations: false,
    disableVisualFX: false,
    largeCursor: false,
    largeClickArea: false,
    virtualAssistantAudio: false,
  });

  const normalizeSourceUrl = (sourceUrl?: string) => {
    if (!sourceUrl) return '';
    const url = String(sourceUrl).trim();
    if (!url) return '';
    return url;
  };

  const sanitizeEventLocation = (ev: CulturalEvent): CulturalEvent => {
    let address = ev.address || '';
    let cityRegion = ev.cityRegion || '';

    // Check if cityRegion already contains a real city name
    const hasRealCityInRegion = cityRegion && 
      !cityRegion.toLowerCase().includes('sua região') && 
      !cityRegion.toLowerCase().includes('sua regiao') &&
      cityRegion !== 'Brasil';

    if (!hasRealCityInRegion) {
      const fullText = (address + ' ' + (ev.title || '') + ' ' + cityRegion).toLowerCase();
      if (
        fullText.includes('taquaral') ||
        fullText.includes('itapura') ||
        fullText.includes('cambuí') ||
        fullText.includes('cambui') ||
        fullText.includes('barão geraldo') ||
        fullText.includes('barao geraldo') ||
        fullText.includes('unicamp') ||
        fullText.includes('campinas')
      ) {
        cityRegion = 'Campinas - SP';
      } else if (fullText.includes('teresina')) {
        cityRegion = 'Teresina - PI';
      } else if (fullText.includes('são paulo') || fullText.includes('sao paulo')) {
        cityRegion = 'São Paulo - SP';
      } else if (fullText.includes('rio de janeiro')) {
        cityRegion = 'Rio de Janeiro - RJ';
      } else if (fullText.includes('salvador')) {
        cityRegion = 'Salvador - BA';
      } else if (fullText.includes('belo horizonte')) {
        cityRegion = 'Belo Horizonte - MG';
      } else {
        cityRegion = 'Campinas - SP';
      }
    }

    // Clean "Sua Região" from address, replacing it with the actual city name
    if (address.toLowerCase().includes('sua região') || address.toLowerCase().includes('sua regiao')) {
      const cleanCityName = cityRegion.split(' - ')[0] || cityRegion;
      address = address.replace(/\s*-\s*Sua Regi[ãa]o/gi, ` - ${cleanCityName}`)
                       .replace(/Sua Regi[ãa]o/gi, cleanCityName);
    }

    return {
      ...ev,
      address,
      cityRegion,
    };
  };

  const deduplicateEvents = (list: CulturalEvent[]): CulturalEvent[] => {
    const seen = new Set<string>();
    return list
      .map((item, idx) => {
        const ev = sanitizeEventLocation(item);
        
        // Compute precise geocoded coordinates based on exact venue, landmark & city
        const geocoded = GeocodingService.geocodeAddress(ev.address, ev.cityRegion);
        
        // Apply micro-dispersion (10m-20m) only if multiple events exist, keeping pin precisely on venue
        const jittered = GeocodingService.jitterCoordinates(geocoded.lat, geocoded.lng, ev.id || ev.title, idx);

        return {
          ...ev,
          lat: jittered.lat,
          lng: jittered.lng,
        };
      })
      .filter((ev) => {
        if (!ev) return false;

        // Filter out events whose dates have already passed
        if (isEventPast(ev)) {
          return false;
        }

        const urlKey = ev.sourceUrl ? ev.sourceUrl.toLowerCase().trim() : '';
        const titleKey = `${(ev.title || '').toLowerCase().trim()}|${(ev.dateRange || '').toLowerCase().trim()}|${(ev.address || '').toLowerCase().trim()}`;
        const primaryKey = urlKey && urlKey.length > 5 ? urlKey : titleKey;
        if (seen.has(primaryKey)) return false;
        seen.add(primaryKey);
        return true;
      });
  };

  const loadPersistedEvents = async () => {
    try {
      const res = await fetch('/api/events/saved');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          let savedEvents = Array.isArray(data?.events) ? data.events : [];

          if (savedEvents.length > 0) {
            const pinColors = ['purple', 'orange', 'green', 'red', 'blue', 'yellow'];
            const realEvents: CulturalEvent[] = savedEvents.map((c: any, i: number) => {
              const geocoded = GeocodingService.geocodeAddress(c.address || '', c.cityRegion || 'Campinas - SP');

              return {
                id: `saved-event-${String(c.sourceUrl || c.title || i).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${i}`,
                title: c.title,
                dateRange: c.dateRange,
                category: normalizeCategory(c.category),
                description: c.description || 'Programação oficial divulgada na fonte original.',
                address: c.address,
                cityRegion: c.cityRegion || 'Campinas - SP',
                lat: geocoded.lat,
                lng: geocoded.lng,
                image: getEventImage(c.image, normalizeCategory(c.category), c.title || `${i}`),
                rating: 0,
                reviewsCount: 0,
                isVirtual: c.isVirtual || false,
                isPaid: c.isPaid || false,
                price: c.price || 'Gratuito',
                distanceKm: 2.8,
                travelTimeMinutes: 8,
                organizer: c.organizer || 'Organizador Responsável',
                isAiGenerated: false,
                sourceUrl: normalizeSourceUrl(c.sourceUrl),
                pinColor: pinColors[i % pinColors.length],
              };
            });

            const localCreated = getLocalCreatedEvents();
            const uniqueLoadedEvents = deduplicateEvents([...localCreated, ...realEvents]);
            setEvents(uniqueLoadedEvents);
            try {
              localStorage.setItem('cultural_map_events_cache', JSON.stringify(uniqueLoadedEvents));
            } catch (e) {}
            return;
          } else {
            const localCreated = getLocalCreatedEvents();
            setEvents(localCreated);
            try {
              localStorage.setItem('cultural_map_events_cache', JSON.stringify(localCreated));
            } catch (e) {}
            return;
          }
        }
      }
    } catch (e) {
      console.log('Sem backend de API (Netlify / Hospedagem Estática). Usando armazenamento local e fallback.');
    }

    // Fallback for Netlify / Static deploy when backend API is unreachable or empty
    const localCreated = getLocalCreatedEvents();
    const fallback = buildFallbackEvents(80, userLocation);
    const combinedFallback = deduplicateEvents([...localCreated, ...fallback]);
    setEvents(combinedFallback);
    try {
      localStorage.setItem('cultural_map_events_cache', JSON.stringify(combinedFallback));
    } catch (e) {}
  };

  const syncAggregatedEvents = async () => {
    try {
      await fetch('/api/aggregator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Auto Discovery Boot' }),
      });
    } catch (e) {
      console.log("Aggregator sync check completed.");
    }
  };

  const clearAllAppEvents = async () => {
    try {
      localStorage.removeItem('cultural_map_events_cache');
      localStorage.removeItem('cultural_map_user_created_events');
      localStorage.removeItem('cultural_map_local_events');
      await fetch('/api/events/clear', { method: 'POST' }).catch(() => {});
      await clearAllFirestoreEvents().catch(() => {});
      setEvents([]);
      setSelectedEvent(null);
    } catch (e) {
      console.error('Erro ao apagar todos os eventos:', e);
    }
  };

  useEffect(() => {
    clearAllAppEvents();

    const unsubscribe = subscribeFirestoreEvents((firestoreEvents) => {
      if (firestoreEvents && firestoreEvents.length > 0) {
        const deduplicated = deduplicateEvents(firestoreEvents);
        setEvents(deduplicated);
      } else {
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Request location on load
  const requestLocation = () => {
    const defaultCenter = { lat: -22.865, lng: -47.165 }; // Área de referência inicial
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });
          setLocationPermissionDenied(false);
        },
        () => {
          setUserLocation(defaultCenter);
          setLocationPermissionDenied(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserLocation(defaultCenter);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Refresh radar handler
  const handleRefreshRadar = async () => {
    await syncAggregatedEvents();
    await loadPersistedEvents();
    setSyncToast(`🔄 Eventos atualizados e re-pesquisados via IA.`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Reset cache and trigger clean fresh AI research
  const handleResetAndSearchWithAI = async () => {
    try {
      localStorage.removeItem('cultural_map_events_cache');
      localStorage.removeItem('cultural_map_local_events');
    } catch (e) {}

    setSyncToast('🤖 Limpando eventos e repesquisando do 0 via IA...');

    try {
      await fetch('/api/aggregator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Fresh AI Location Research' }),
      });
      await fetch('/api/ai/seed-events', { method: 'POST' });
    } catch (e) {
      console.log('AI crawler executed.');
    }

    await loadPersistedEvents();
    setSyncToast('✨ Pesquisa do 0 concluída! Localizações geocodificadas com precisão.');
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Recalculate event distances when user GPS location is obtained
  useEffect(() => {
    if (!userLocation) return;
    setEvents((prev) =>
      prev.map((ev) => {
        const dist = getDistanceKm(userLocation.lat, userLocation.lng, ev.lat, ev.lng);
        const time = getEstimatedTravelTimeMinutes(dist);
        return {
          ...ev,
          distanceKm: dist,
          travelTimeMinutes: time,
        };
      })
    );
  }, [userLocation]);

  // Filter Events Logic
  const filteredEvents = events.filter((ev) => {
    if (!ev) return false;

    // Remove events that already passed
    if (isEventPast(ev)) {
      return false;
    }

    if (quizFilterIds && !quizFilterIds.includes(ev.id)) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (ev.title || '').toLowerCase().includes(q) ||
        (ev.category || '').toLowerCase().includes(q) ||
        (ev.address || '').toLowerCase().includes(q) ||
        (ev.cityRegion || '').toLowerCase().includes(q) ||
        (ev.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    if (categoryFilter !== 'Todas as categorias' && !isCategoryMatch(ev.category, categoryFilter)) {
      return false;
    }

    if (ev.distanceKm > maxDistanceKm) {
      return false;
    }

    if (formatFilter === 'presencial' && ev.isVirtual) return false;
    if (formatFilter === 'virtual' && !ev.isVirtual) return false;

    if (costFilter === 'free' && ev.isPaid) return false;
    if (costFilter === 'paid' && !ev.isPaid) return false;

    if (happeningNowOnly && !ev.isHappeningNow) return false;

    return true;
  }).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  // Handlers
  const handleToggleSave = (eventId: string) => {
    if (!userProfile.isLoggedIn) {
      setLoginModalReason('Para salvar e favoritar este evento, faça login ou identifique-se em sua conta.');
      setPendingAction(() => () => {
        setUserProfile((prev) => {
          const exists = prev.savedEventIds.includes(eventId);
          return {
            ...prev,
            savedEventIds: exists
              ? prev.savedEventIds.filter((id) => id !== eventId)
              : [...prev.savedEventIds, eventId],
          };
        });
      });
      setShowLoginModal(true);
      return;
    }

    setUserProfile((prev) => {
      const exists = prev.savedEventIds.includes(eventId);
      return {
        ...prev,
        savedEventIds: exists
          ? prev.savedEventIds.filter((id) => id !== eventId)
          : [...prev.savedEventIds, eventId],
      };
    });
  };

  const handleOpenCreateEvent = () => {
    if (!userProfile.isLoggedIn) {
      setLoginModalReason('Para anunciar e publicar um novo evento no Mapa, faça login em sua conta.');
      setPendingAction(() => () => {
        setCurrentView('create');
      });
      setShowLoginModal(true);
      return;
    }
    setCurrentView('create');
  };

  const handleLoginSuccess = (name: string, email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const accountKey = getAccountKey(normalizedEmail);

    let existingAccount: Partial<UserProfile> = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(accountKey);
        if (stored) {
          existingAccount = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading stored user account:', e);
      }
    }

    setUserProfile((prev) => {
      const existingSaved = Array.isArray(existingAccount.savedEventIds) ? existingAccount.savedEventIds : [];
      const mergedSaved = Array.from(new Set([...existingSaved, ...prev.savedEventIds]));

      const existingParticipated = Array.isArray(existingAccount.participatedEventIds) ? existingAccount.participatedEventIds : [];
      const mergedParticipated = Array.from(new Set([...existingParticipated, ...prev.participatedEventIds]));

      const existingReminders = Array.isArray(existingAccount.reminders) && existingAccount.reminders.length > 0
        ? existingAccount.reminders
        : prev.reminders;

      const existingReviews = Array.isArray(existingAccount.userReviews) && existingAccount.userReviews.length > 0
        ? existingAccount.userReviews
        : prev.userReviews;

      const updatedName = name.trim() || existingAccount.name || (email.split('@')[0]) || 'Usuário Cultural';

      const newProfile: UserProfile = {
        isLoggedIn: true,
        name: updatedName,
        email: normalizedEmail,
        savedEventIds: mergedSaved,
        participatedEventIds: mergedParticipated,
        reminders: existingReminders,
        userReviews: existingReviews,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(accountKey, JSON.stringify(newProfile));
          localStorage.setItem('cultural_map_user_profile', JSON.stringify(newProfile));
        } catch (e) {
          console.error('Error saving account profile:', e);
        }
      }

      return newProfile;
    });

    setShowLoginModal(false);
    setLoginModalReason(null);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleLogout = () => {
    // Save current account state before resetting
    if (userProfile.isLoggedIn && userProfile.email && typeof window !== 'undefined') {
      try {
        const accountKey = getAccountKey(userProfile.email);
        localStorage.setItem(accountKey, JSON.stringify(userProfile));
      } catch (e) {
        console.error('Error saving account before logout:', e);
      }
    }

    const visitorProfile: UserProfile = {
      isLoggedIn: false,
      name: 'Visitante',
      email: '',
      savedEventIds: [],
      participatedEventIds: [],
      reminders: [],
      userReviews: [],
    };

    setUserProfile(visitorProfile);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cultural_map_user_profile', JSON.stringify(visitorProfile));
      } catch (e) {
        console.error('Error resetting profile on logout:', e);
      }
    }
  };

  const handleToggleParticipated = (eventId: string) => {
    setUserProfile((prev) => {
      const exists = prev.participatedEventIds.includes(eventId);
      return {
        ...prev,
        participatedEventIds: exists
          ? prev.participatedEventIds.filter((id) => id !== eventId)
          : [...prev.participatedEventIds, eventId],
      };
    });
  };

  const handleAddReminder = (eventId: string, minutesBefore: number) => {
    setUserProfile((prev) => ({
      ...prev,
      reminders: [
        ...prev.reminders.filter((r) => r.eventId !== eventId),
        { eventId, alertOffsetMinutes: minutesBefore, createdAt: new Date().toISOString() },
      ],
    }));
  };

  const handleAddReview = (eventId: string, rating: number, comment: string) => {
    const target = events.find((e) => e.id === eventId);
    if (target) {
      addFirestoreReview(
        eventId,
        {
          author: userProfile.name || 'Anônimo',
          rating,
          comment,
          date: new Date().toISOString().split('T')[0],
        },
        target.rating,
        target.reviewsCount
      ).catch((e) => console.error('Error saving review to Firestore:', e));
    }

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const newReviewsCount = e.reviewsCount + 1;
          const newAvgRating = e.reviewsCount === 0 
            ? Number(rating.toFixed(1))
            : Number(((e.rating * e.reviewsCount + rating) / newReviewsCount).toFixed(1));
          return {
            ...e,
            rating: newAvgRating,
            reviewsCount: newReviewsCount,
          };
        }
        return e;
      })
    );
  };

  const handleTraceRoute = (event: CulturalEvent) => {
    setActiveRouteEvent(event);
    setCurrentView('map');
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`;
    window.open(mapsUrl, '_blank');
  };

  const getAccessibilityClasses = () => {
    let classes = [];
    if (accessibility.highContrast) classes.push('high-contrast');
    if (accessibility.largeCursor) classes.push('cursor-large');
    if (accessibility.largeClickArea) classes.push('large-click-area');
    if (accessibility.dyslexiaFont) classes.push('font-dyslexic');

    if (accessibility.daltonismFilter === 'protanopia') classes.push('daltonism-protanopia');
    if (accessibility.daltonismFilter === 'deuteranopia') classes.push('daltonism-deuteranopia');
    if (accessibility.daltonismFilter === 'tritanopia') classes.push('daltonism-tritanopia');

    return classes.join(' ');
  };

  return (
    <div className={`w-screen h-screen flex flex-col bg-[#0e0f12] text-zinc-100 overflow-hidden ${getAccessibilityClasses()}`}>
      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] bg-emerald-950/90 text-emerald-200 border border-emerald-500/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{syncToast}</span>
          <button onClick={() => setSyncToast(null)} className="text-emerald-400 hover:text-white ml-2 text-xs">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢</button>
        </div>
      )}

      {/* Header Bar */}
      {currentView !== 'landing' && (
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenFilterModal={() => setShowFilterModal(true)}
          onOpenQuizModal={() => setShowQuizModal(true)}
          onOpenCreateEvent={handleOpenCreateEvent}
          onResetAndSearchAI={handleResetAndSearchWithAI}
          userProfile={userProfile}
          onOpenLoginModal={() => {
            setLoginModalReason(null);
            setShowLoginModal(true);
          }}
          accessibility={accessibility}
          totalEventsCount={events.length}
          onFetchMoreEvents={handleRefreshRadar}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex">
        {currentView === 'landing' && (
          <LandingHeroView
            onExploreEvents={() => {
              setCurrentView('map');
              requestLocation();
            }}
            onNavigate={(view) => {
              if (view === 'create') {
                handleOpenCreateEvent();
              } else {
                setCurrentView(view);
              }
            }}
            onSearchLocation={(locText) => {
              setSearchQuery(locText);
            }}
          />
        )}

        {currentView === 'map' && (
          <div className="w-full h-full relative overflow-hidden bg-[#0a0b0e]">
            {/* Interactive Map View */}
            <div className="absolute inset-0 z-0">
              <InteractiveMap
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onSelectEvent={(ev) => setSelectedEvent(ev)}
                userLocation={userLocation}
                onRequestUserLocation={requestLocation}
                locationPermissionDenied={locationPermissionDenied}
                activeRouteEvent={activeRouteEvent}
                onClearRoute={() => setActiveRouteEvent(null)}
              />
            </div>

            {/* Active Quiz Filter Indicator */}
            {quizFilterIds && (
              <div className="absolute left-3 top-3 z-20 pointer-events-auto">
                <div className="px-3 py-1.5 rounded-full bg-orange-950/90 text-orange-200 border border-orange-500/50 backdrop-blur-md text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn">
                  <span>Filtro de Quiz ({filteredEvents.length} eventos)</span>
                  <button
                    onClick={() => setQuizFilterIds(null)}
                    className="text-orange-400 hover:text-white font-bold text-xs cursor-pointer"
                    title="Limpar filtro do Quiz"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Floating Right Side Event Panel */}
            <div className="absolute right-2 sm:right-4 top-2 sm:top-4 bottom-2 sm:bottom-4 z-20 w-full max-w-[82vw] sm:w-[260px] md:w-[270px] pointer-events-none flex flex-col justify-end lg:justify-start">
              <div className="w-full h-full max-h-[calc(100vh-4.5rem)] pointer-events-auto overflow-hidden rounded-[20px] sm:rounded-[24px] border border-zinc-800/70 bg-[#101216]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col">
                <EventDrawer
                  events={filteredEvents}
                  selectedEvent={selectedEvent}
                  onSelectEvent={(ev) => setSelectedEvent(ev)}
                  userProfile={userProfile}
                  onToggleSave={handleToggleSave}
                  onToggleParticipated={handleToggleParticipated}
                  onAddReminder={handleAddReminder}
                  onAddReview={handleAddReview}
                  onTraceRoute={handleTraceRoute}
                />
              </div>
            </div>
          </div>
        )}

        {currentView === 'calendar' && (
          <CalendarView
            events={events}
            userProfile={userProfile}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onGoToMap={() => setCurrentView('map')}
            userLocation={userLocation}
          />
        )}

        {currentView === 'saved' && (
          <SavedEventsView
            events={events}
            userProfile={userProfile}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onToggleSave={handleToggleSave}
            onGoToMap={() => setCurrentView('map')}
          />
        )}

        {currentView === 'settings' && (
          <AccessibilityView
            settings={accessibility}
            onUpdateSettings={(newSettings) =>
              setAccessibility((prev) => ({ ...prev, ...newSettings }))
            }
            onGoToMap={() => setCurrentView('map')}
          />
        )}

        {currentView === 'create' && (
          <CreateEventView
            onAddEvent={(newEv) => {
              createFirestoreEvent(newEv).catch((err) => console.error('Error syncing event to Firestore:', err));
              setEvents((prev) => {
                const updated = deduplicateEvents([newEv, ...prev]);
                if (typeof window !== 'undefined') {
                  try {
                    const localCreated = getLocalCreatedEvents();
                    const newLocal = deduplicateEvents([newEv, ...localCreated]);
                    localStorage.setItem('cultural_map_user_created_events', JSON.stringify(newLocal));
                    localStorage.setItem('cultural_map_events_cache', JSON.stringify(updated));
                  } catch (e) {
                    console.error('Error persisting new event locally:', e);
                  }
                }
                return updated;
              });
              setSelectedEvent(newEv);
            }}
            onGoToMap={() => setCurrentView('map')}
          />
        )}

        {currentView === 'admin' && (
          <DiscoveryAdminView
            onGoToMap={() => setCurrentView('map')}
            onEventsUpdated={syncAggregatedEvents}
          />
        )}
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          maxDistanceKm={maxDistanceKm}
          setMaxDistanceKm={setMaxDistanceKm}
          formatFilter={formatFilter}
          setFormatFilter={setFormatFilter}
          costFilter={costFilter}
          setCostFilter={setCostFilter}
          happeningNowOnly={happeningNowOnly}
          setHappeningNowOnly={setHappeningNowOnly}
          filteredEventsCount={filteredEvents.length}
          onClose={() => setShowFilterModal(false)}
          onResetFilters={() => {
            setCategoryFilter('Todas as categorias');
            setMaxDistanceKm(50);
            setFormatFilter('all');
            setCostFilter('all');
            setHappeningNowOnly(false);
          }}
        />
      )}

      {/* Event Quiz Modal */}
      {showQuizModal && (
        <EventQuizModal
          events={events}
          savedEventIds={userProfile.savedEventIds}
          onToggleSave={handleToggleSave}
          onClose={() => setShowQuizModal(false)}
          onSelectEvent={(ev) => {
            setSelectedEvent(ev);
            setCurrentView('map');
          }}
          onApplyQuizFilter={(matchedEvents) => {
            setQuizFilterIds(matchedEvents.map((m) => m.id));
            setCurrentView('map');
          }}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          userProfile={userProfile}
          reason={loginModalReason}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onClose={() => {
            setShowLoginModal(false);
            setLoginModalReason(null);
          }}
        />
      )}
    </div>
  );
}

