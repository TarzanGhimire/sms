/**
 * Bikram Sambat (BS) ↔ Gregorian (AD) date conversion.
 * Uses a lookup table of days-in-each-BS-month per year.
 * Covers BS 2080–2090 (AD ~2023–2034), sufficient for current operations.
 */

// Days in each month (Baishakh..Chaitra) for BS years 2080-2090
const BS_CALENDAR: Record<number, number[]> = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 29, 31],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 29, 31],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 29, 31],
  2089: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

// Reference: BS 2080-01-01 === AD 2023-04-14
const BS_EPOCH_YEAR = 2080;
const AD_EPOCH = new Date(2023, 3, 14); // months are 0-indexed

export const NEPALI_MONTHS = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

export interface BSDate {
  year: number;
  month: number; // 1-12
  day: number;
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Convert an AD date to BS. Returns null if outside supported range. */
export function adToBs(date: Date | string): BSDate | null {
  const ad = typeof date === 'string' ? new Date(date) : date;
  const target = new Date(ad.getFullYear(), ad.getMonth(), ad.getDate());
  let offset = daysBetween(AD_EPOCH, target);
  if (offset < 0) return null;

  let year = BS_EPOCH_YEAR;
  let month = 1;
  let day = 1;

  while (offset > 0) {
    const months = BS_CALENDAR[year];
    if (!months) return null;
    const daysInMonth = months[month - 1];
    if (day < daysInMonth) {
      day++;
    } else {
      day = 1;
      if (month < 12) {
        month++;
      } else {
        month = 1;
        year++;
      }
    }
    offset--;
  }

  return { year, month, day };
}

/** Format an AD date as a BS string, e.g. "15 Jestha 2081". */
export function formatBs(date: Date | string): string {
  const bs = adToBs(date);
  if (!bs) return '—';
  return `${bs.day} ${NEPALI_MONTHS[bs.month - 1]} ${bs.year}`;
}

/** Today's BS date as a formatted string. */
export function todayBs(): string {
  return formatBs(new Date());
}

/** e.g. "Jestha 2083" — the dominant BS month for the given date. */
export function formatBsMonthYear(date: Date | string): string {
  const bs = adToBs(date);
  if (!bs) return '—';
  return `${NEPALI_MONTHS[bs.month - 1]} ${bs.year}`;
}

/** BS month/year for an AD billing month (1-12) + year (uses the 20th, the usual due date). */
export function billingPeriodBs(adMonth: number, adYear: number): string {
  return formatBsMonthYear(new Date(adYear, adMonth - 1, 20));
}
