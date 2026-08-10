// Haversine formula to compute actual distance in kilometers between two GPS points
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Estimate travel time in minutes based on travel mode
export function getEstimatedTravelTimeMinutes(
  distanceKm: number,
  mode: 'car' | 'walk' | 'bicycle' | 'transit' = 'car'
): number {
  if (distanceKm <= 0) return 0;
  let avgSpeedKmH = 35;
  if (mode === 'walk') avgSpeedKmH = 4.8;
  else if (mode === 'bicycle') avgSpeedKmH = 15;
  else if (mode === 'transit') avgSpeedKmH = 20;

  const timeHours = distanceKm / avgSpeedKmH;
  const timeMinutes = Math.round(timeHours * 60) + (mode === 'car' ? 2 : 0);
  return Math.max(1, timeMinutes);
}
