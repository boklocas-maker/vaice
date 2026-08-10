import { CulturalEvent } from '../types';

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const WEEKDAY_NAMES = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export const WEEKDAY_SHORT_NAMES = [
  'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'
];

/**
 * Checks if a cultural event's date has already passed relative to referenceDate (defaults to today).
 */
export function isEventPast(event: CulturalEvent, referenceDate: Date = new Date()): boolean {
  if (!event || !event.dateRange) return false;

  const raw = event.dateRange.toLowerCase().trim();

  // 1. Permanent / Recurring / Relative keywords that mean the event is active today/future
  if (
    raw.includes('hoje') ||
    raw.includes('amanhã') ||
    raw.includes('amanha') ||
    raw.includes('fim de semana') ||
    raw.includes('sempre') ||
    raw.includes('permanente') ||
    raw.includes('diário') ||
    raw.includes('diario') ||
    raw.includes('todos os dias') ||
    raw.includes('diariamente')
  ) {
    return false;
  }

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth(); // 0-indexed
  const refDay = referenceDate.getDate();
  const todayStart = new Date(refYear, refMonth, refDay, 0, 0, 0, 0);

  // 2. Explicit Year match (e.g. 2024, 2025, 2026)
  const yearMatches = raw.match(/\b(202\d)\b/g);
  if (yearMatches && yearMatches.length > 0) {
    const explicitYear = parseInt(yearMatches[yearMatches.length - 1], 10);
    if (explicitYear < refYear) {
      return true; // Explicitly past year
    }
    if (explicitYear > refYear) {
      return false; // Explicitly future year
    }
  }

  // 3. Extract Month & Day
  let eventMonth = refMonth;
  let monthFound = false;

  MONTH_NAMES.forEach((m, idx) => {
    const mName = m.toLowerCase();
    const mShort = MONTH_SHORT_NAMES[idx].toLowerCase();
    if (raw.includes(mName) || raw.includes(mShort)) {
      eventMonth = idx;
      monthFound = true;
    }
  });

  // ISO / Slash numeric date checks if no textual month
  if (!monthFound) {
    const isoMatch = raw.match(/\b(202\d)[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const eventEndDate = new Date(year, month, day, 23, 59, 59, 999);
      return eventEndDate < todayStart;
    }

    const slashMatch = raw.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);
      const month = parseInt(slashMatch[2], 10) - 1;
      let year = refYear;
      if (slashMatch[3]) {
        const parsedYear = parseInt(slashMatch[3], 10);
        year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
      }
      const eventEndDate = new Date(year, month, day, 23, 59, 59, 999);
      return eventEndDate < todayStart;
    }
  }

  const cleanedStr = raw.replace(/\b202\d\b/g, '');
  let endDay = 0;

  const ateMatch = cleanedStr.match(/até\s*(\d{1,2})/);
  if (ateMatch) {
    endDay = parseInt(ateMatch[1], 10);
  } else {
    const rangeMatch = cleanedStr.match(/(\d{1,2})\s*(?:a|-|à|e)\s*(\d{1,2})/);
    if (rangeMatch) {
      endDay = parseInt(rangeMatch[2], 10);
    } else {
      const dayMatches = cleanedStr.match(/\b(\d{1,2})\b/g);
      if (dayMatches && dayMatches.length > 0) {
        const validDays = dayMatches.map(d => parseInt(d, 10)).filter(d => d >= 1 && d <= 31);
        if (validDays.length > 0) {
          endDay = validDays[validDays.length - 1];
        }
      }
    }
  }

  if (endDay === 0) {
    if (monthFound) {
      if (eventMonth < refMonth) return true;
      if (eventMonth > refMonth) return false;
      return false;
    }
    return false;
  }

  const eventEndDate = new Date(refYear, eventMonth, endDay, 23, 59, 59, 999);
  return eventEndDate < todayStart;
}


/**
 * Checks if a given cultural event matches a specific year, monthIndex (0-11), and optional day (1-31).
 */
export function isEventOnDate(
  event: CulturalEvent,
  year: number,
  monthIndex: number,
  day?: number
): boolean {
  if (!event || !event.dateRange) return false;

  const rawStr = event.dateRange.toLowerCase();

  // Separate date portion from time portion (split by '•', '|', or ' - ')
  const parts = rawStr.split(/[•|]/);
  const dateStr = parts[0].trim();

  // 1. Month match check
  const targetMonthName = MONTH_NAMES[monthIndex].toLowerCase();
  const targetMonthShort = MONTH_SHORT_NAMES[monthIndex].toLowerCase();
  const targetMonthNum = (monthIndex + 1).toString().padStart(2, '0'); // e.g. "08"

  const hasMonthInText =
    dateStr.includes(targetMonthName) ||
    dateStr.includes(targetMonthShort) ||
    dateStr.includes(`/${targetMonthNum}/`) ||
    dateStr.includes(`-${targetMonthNum}-`) ||
    dateStr.includes(`.${targetMonthNum}.`);

  // Check if text specifies a completely DIFFERENT month
  let specifiesOtherMonth = false;
  MONTH_NAMES.forEach((m, idx) => {
    if (idx !== monthIndex) {
      const mName = m.toLowerCase();
      const mNum = (idx + 1).toString().padStart(2, '0');
      if (dateStr.includes(mName) || dateStr.includes(`/${mNum}/`) || dateStr.includes(`-${mNum}-`)) {
        specifiesOtherMonth = true;
      }
    }
  });

  // If text explicitly specifies another month and NOT the target month, skip
  if (specifiesOtherMonth && !hasMonthInText) {
    return false;
  }

  // Check Year
  if (dateStr.includes('202') && !dateStr.includes(year.toString())) {
    return false;
  }

  // If no day specified, return whether month matches
  if (day === undefined) {
    return hasMonthInText || !specifiesOtherMonth;
  }

  // 2. Day matching on cleaned date string
  // Remove year numbers (e.g. 2026), month names, to avoid false day matches (e.g. 20 from 2026)
  const cleanedDateStr = dateStr
    .replace(/\b202\d\b/g, '')
    .replace(new RegExp(`\\b${targetMonthName}\\b`, 'g'), '')
    .replace(new RegExp(`\\b${targetMonthShort}\\b`, 'g'), '');

  // Check Range: e.g. "20 a 22", "20 à 22", "20-22"
  const rangeMatch = cleanedDateStr.match(/(\d{1,2})\s*(?:a|-|à|e)\s*(\d{1,2})/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      if (day >= start && day <= end) {
        return true;
      }
    }
  }

  // "Até 30"
  const ateMatch = cleanedDateStr.match(/até\s*(\d{1,2})/);
  if (ateMatch) {
    const end = parseInt(ateMatch[1], 10);
    if (!isNaN(end) && day <= end) {
      return true;
    }
  }

  // Listed days "22 e 23"
  const eMatch = cleanedDateStr.match(/(\d{1,2})\s*e\s*(\d{1,2})/);
  if (eMatch) {
    const d1 = parseInt(eMatch[1], 10);
    const d2 = parseInt(eMatch[2], 10);
    if (day === d1 || day === d2) return true;
  }

  // Check ISO format YYYY-MM-DD or DD/MM
  const dayPadded = day.toString().padStart(2, '0');
  if (rawStr.includes(`${year}-${targetMonthNum}-${dayPadded}`)) {
    return true;
  }
  if (rawStr.includes(`${dayPadded}/${targetMonthNum}`) || rawStr.includes(`${day}/${targetMonthNum}`)) {
    return true;
  }

  // Single Day match with word boundary \b
  const dayRegex = new RegExp(`\\b0?${day}\\b`);
  if (dayRegex.test(cleanedDateStr)) {
    return true;
  }

  // Recurring / weekly (e.g. "Aos Sábados e Domingos")
  if (rawStr.includes('sábado') || rawStr.includes('domingo') || rawStr.includes('diário') || rawStr.includes('todos os dias')) {
    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Dom, 6 = Sáb
    if (rawStr.includes('sábado') && dayOfWeek === 6) return true;
    if (rawStr.includes('domingo') && dayOfWeek === 0) return true;
    if (rawStr.includes('diário') || rawStr.includes('todos os dias')) return true;
  }

  return false;
}

/**
 * Helper to generate full days matrix for a calendar month
 */
export interface CalendarDayCell {
  day: number;
  monthIndex: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateKey: string; // YYYY-MM-DD
}

export function getCalendarGrid(year: number, monthIndex: number): CalendarDayCell[] {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, monthIndex, 0).getDate();

  const cells: CalendarDayCell[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const prevMonthIdx = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    cells.push({
      day,
      monthIndex: prevMonthIdx,
      year: prevYear,
      isCurrentMonth: false,
      isToday: false,
      dateKey: `${prevYear}-${(prevMonthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    });
  }

  // Current month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const isToday = year === todayYear && monthIndex === todayMonth && day === todayDay;
    cells.push({
      day,
      monthIndex,
      year,
      isCurrentMonth: true,
      isToday,
      dateKey: `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    });
  }

  // Next month leading days to complete 35 or 42 grid cells
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthIdx = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    cells.push({
      day,
      monthIndex: nextMonthIdx,
      year: nextYear,
      isCurrentMonth: false,
      isToday: false,
      dateKey: `${nextYear}-${(nextMonthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    });
  }

  return cells;
}
