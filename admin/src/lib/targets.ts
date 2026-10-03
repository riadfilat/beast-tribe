// Targets from the commercial plan (October 2026 – March 2027). Shown on the Business page so
// progress is one glance. Change them here when the plan changes.
export const TARGET_DATE = '2027-03-31';
export const TARGETS = {
  members: 3000,
  active_7d: 800,
  gym: 6, // paying gyms and clubs
  company: 4, // paying companies
  company_seats: 1000,
  coach: 15,
  venue: 5,
  mrr: 23500, // SAR a month
} as const;

// December 2027: the run-rate the investor deck's "2027" column describes.
export const YEAR_END_2027 = { gym: 20, company: 20, coach: 50, venue: 30, members: 20000, mrr: 107000 } as const;
