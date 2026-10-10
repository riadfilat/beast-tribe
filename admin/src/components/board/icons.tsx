import {
  Barbell,
  CalendarBlank,
  ChartBar,
  CourtBasketball,
  Gauge,
  HouseLine,
  Lightbulb,
  PuzzlePiece,
  Storefront,
  UsersThree,
  Strategy,
  Ticket,
  BowlFood,
  UsersFour,
  ShieldStar,
  MapPin,
  WarningOctagon,
  Pulse,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

// One professional icon set (Phosphor) for the board dashboards, by menu key.
const BY_KEY: Record<string, PhosphorIcon> = {
  home: HouseLine,
  sessions: CalendarBlank,
  courts: CourtBasketball,
  guests: Ticket,
  coaching: Strategy,
  nutrition: BowlFood,
  teams: UsersFour,
  people: UsersThree,
  features: PuzzlePiece,
  profile: Storefront,
  insights: Lightbulb,
  chart: ChartBar,
  gym: Barbell,
  command: Gauge,
  communities: ShieldStar,
  places: MapPin,
  safety: WarningOctagon,
  growth: Pulse,
};

export function NavIcon({ name, active, size = 20 }: { name: string; active?: boolean; size?: number }) {
  const I = BY_KEY[name] ?? HouseLine;
  return <I size={size} weight={active ? 'fill' : 'regular'} aria-hidden />;
}
