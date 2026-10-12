/**
 * The app's Train tab (workouts, plans, the exercise library). Off for launch (2026-10-04, the
 * user's call) until it is complete; keep in step with TRAIN_ENABLED in the app's src/lib/constants.ts.
 * With it off, partners don't publish workouts, Ask Beast doesn't suggest them, and the public
 * pages don't promise a training library.
 */
export const TRAIN_ENABLED = false;

/**
 * Booking courts inside the app. Off for go-live (2026-10-12, the user's call: no court integrations
 * at launch); keep in step with COURT_BOOKING_ENABLED in the app's src/lib/constants.ts. With it off,
 * leaders can't switch on "Courts & booking" and Ask Beast doesn't offer courts to book.
 */
export const COURT_BOOKING_ENABLED = false;
