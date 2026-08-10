import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  getDocs, 
  deleteDoc,
  query, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CulturalEvent, UserProfile, EventReview } from '../types';

const EVENTS_COLLECTION = 'events';
const PROFILES_COLLECTION = 'user_profiles';

/**
 * Subscribe to real-time events updates in Firestore.
 */
export function subscribeFirestoreEvents(
  onUpdate: (events: CulturalEvent[]) => void,
  onError?: (err: any) => void
): () => void {
  const eventsRef = collection(db, EVENTS_COLLECTION);

  const unsubscribe = onSnapshot(
    eventsRef,
    async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      const eventsList: CulturalEvent[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CulturalEvent;
        eventsList.push({
          ...data,
          id: docSnap.id,
        });
      });

      onUpdate(eventsList);
    },
    (error) => {
      console.error('Firestore realtime listener error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Delete all events stored in Firestore
 */
export async function clearAllFirestoreEvents(): Promise<void> {
  try {
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const snapshot = await getDocs(eventsRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    console.log('Todos os eventos no Firestore foram excluídos.');
  } catch (e) {
    console.error('Error clearing Firestore events:', e);
  }
}

/**
 * Save a new event to Firestore (syncs across all devices globally)
 */
export async function createFirestoreEvent(event: CulturalEvent): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, event.id);
  await setDoc(docRef, {
    ...event,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

/**
 * Add a review to an event in Firestore
 */
export async function addFirestoreReview(
  eventId: string, 
  review: Omit<EventReview, 'id'>, 
  currentRating: number, 
  currentReviewsCount: number
): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, eventId);
  
  const newReviewsCount = currentReviewsCount + 1;
  const newAvgRating = currentReviewsCount === 0 
    ? Number(review.rating.toFixed(1))
    : Number(((currentRating * currentReviewsCount + review.rating) / newReviewsCount).toFixed(1));

  const newReviewObj: EventReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...review,
  };

  // Update doc with review
  await updateDoc(docRef, {
    rating: newAvgRating,
    reviewsCount: newReviewsCount,
    reviews: [newReviewObj], // append/replace
  }).catch(async () => {
    // If update fails because reviews field doesn't exist, setDoc merge
    await setDoc(docRef, {
      rating: newAvgRating,
      reviewsCount: newReviewsCount,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  });
}

/**
 * Sync user profile (saved events, participated events, etc.) across devices by user account/email
 */
export function subscribeFirestoreUserProfile(
  accountKey: string,
  onUpdate: (profile: Partial<UserProfile>) => void
): () => void {
  if (!accountKey) return () => {};

  const cleanKey = accountKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  const userRef = doc(db, PROFILES_COLLECTION, cleanKey);

  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as Partial<UserProfile>);
    }
  });
}

/**
 * Save user profile state to Firestore
 */
export async function saveFirestoreUserProfile(
  accountKey: string,
  profile: UserProfile
): Promise<void> {
  if (!accountKey) return;
  const cleanKey = accountKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  const userRef = doc(db, PROFILES_COLLECTION, cleanKey);

  await setDoc(userRef, {
    name: profile.name,
    email: profile.email,
    savedEventIds: profile.savedEventIds || [],
    participatedEventIds: profile.participatedEventIds || [],
    reminders: profile.reminders || [],
    userReviews: profile.userReviews || [],
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
