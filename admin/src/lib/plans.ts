// Partner plans: a flat monthly subscription for coaches and gyms. No commission on anything
// they sell or book through Beast Tribe, so there is never a reason to take members off the app.
// Prices are in SAR, before VAT. Yearly = 10 months (two months free).

export type PlanId = 'coach' | 'studio' | 'club' | 'multi' | 'company' | 'venue';

export interface Plan {
  id: PlanId;
  audience: 'coach' | 'gym' | 'company' | 'venue';
  /** Price unit when it isn't per month for the whole account. */
  unit?: string;
  name: string;
  monthly: number | null; // null = talk to us
  tagline: string;
  limit: string;
  features: string[];
}

export const TRIAL_DAYS = 30;

export const PLANS: Plan[] = [
  {
    id: 'coach',
    audience: 'coach',
    name: 'Coach',
    monthly: 149,
    tagline: 'For independent coaches',
    limit: 'Unlimited clients',
    features: [
      'Your coach profile, sessions and bookable hours',
      'Clients share their training and food with you, by consent',
      'Publish workouts to the library and get paid when members use them',
      'Keep 100% of what you charge',
    ],
  },
  {
    id: 'studio',
    audience: 'gym',
    name: 'Studio',
    monthly: 790,
    tagline: 'For boutique studios and boxes',
    limit: 'Up to 300 members · 5 coaches included',
    features: [
      'Your private club inside the app, joined with your code',
      'Class schedule with booking, waitlist and attendance',
      'Member dashboard: who is active, who is drifting',
      'Busiest-times map and monthly results',
      'Club feed and packs that keep members talking',
    ],
  },
  {
    id: 'club',
    audience: 'gym',
    name: 'Club',
    monthly: 1590,
    tagline: 'For full gyms and sports clubs',
    limit: 'Up to 1,500 members · unlimited coaches',
    features: [
      'Everything in Studio',
      'Room for 1,500 members and every coach on your team',
      'We help you launch: setup and onboarding of your members',
      'Priority support',
    ],
  },
  {
    id: 'multi',
    audience: 'gym',
    name: 'Multi-branch',
    monthly: null,
    tagline: 'For chains and multiple locations',
    limit: 'Several branches, one view',
    features: ['Everything in Club', 'One club per branch, rolled up for head office', 'Dedicated account manager'],
  },
];

PLANS.push({
  id: 'company',
  audience: 'company',
  name: 'Company',
  monthly: 10,
  unit: 'per seat a month',
  tagline: 'For employers and compounds',
  limit: 'Pay for the seats you use',
  features: [
    'A private community for your people, joined with your code',
    'Sessions, packs and step challenges across teams and offices',
    'A dashboard of participation, never personal health data',
    'Nutritionists, gyms and coaches included in your package',
  ],
});

PLANS.push({
  id: 'venue',
  audience: 'venue',
  name: 'Venue',
  monthly: 1000,
  tagline: 'For healthy restaurants and courts',
  limit: 'One listing, every community that can see you',
  features: ['Your offer in front of active members', 'A member code to track what it brings in', 'Featured when sessions happen near you'],
});

export const planOf = (id: string | null | undefined) => PLANS.find((p) => p.id === id) || null;

export const sar = (n: number) => `${n.toLocaleString('en-US')} SAR`;

export const PLAN_STATUS_LABEL: Record<string, string> = {
  trial: 'Free trial',
  active: 'Active',
  past_due: 'Payment due',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

/** Everyone's promise, whatever the plan. */
export const PROMISES = ['0% commission, ever', 'Members always free', `${TRIAL_DAYS}-day free trial`, 'Cancel any time'];

export const SALES_EMAIL = 'support@operationbeast.com';
