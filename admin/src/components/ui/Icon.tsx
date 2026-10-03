import type { SVGProps } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Barbell,
  Buildings,
  CalendarDots,
  CaretDown,
  CaretUp,
  ChartLineUp,
  Funnel,
  Footprints,
  Printer,
  ChatsCircle,
  Coins,
  Check,
  CheckCircle,
  Confetti,
  ForkKnife,
  Key,
  LockSimple,
  GearSix,
  GlobeHemisphereEast,
  Handshake,
  HourglassMedium,
  HouseLine,
  Image as ImageIcon,
  LinkSimple,
  List,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  SignOut,
  SquaresFour,
  Star,
  UploadSimple,
  UsersThree,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon, IconWeight } from '@phosphor-icons/react';
import { WOLF_PATHS, WOLF_SIZE } from '@/components/brand/paths';

// The admin's one icon system (Phosphor). Solid ("fill") by default, like the app's solid
// SF Symbols / Ionicons; icons inherit colour from the text (currentColor).
// Usage: <Icon name="events" /> beside visible text (decorative, hidden from screen readers);
// <Icon name="close" label="Close" /> when the icon is the only content.
// Do: use these names and sizes only. Don't: emoji, <img> icons, or a second icon library.

const ICONS = {
  dashboard: SquaresFour,
  users: UsersThree,
  communities: HouseLine,
  events: CalendarDots,
  locations: MapPin,
  feed: ChatsCircle,
  moderation: ShieldCheck,
  partners: Handshake,
  settings: GearSix,
  menu: List,
  close: X,
  signOut: SignOut,
  search: MagnifyingGlass,
  warning: WarningCircle,
  success: CheckCircle,
  error: XCircle,
  pending: HourglassMedium,
  coach: Barbell,
  workouts: Barbell,
  payouts: Coins,
  business: ChartLineUp,
  leads: Funnel,
  steps: Footprints,
  print: Printer,
  gym: Buildings,
  eventCompany: Confetti,
  food: ForkKnife,
  key: Key,
  lock: LockSimple,
  upload: UploadSimple,
  link: LinkSimple,
  photo: ImageIcon,
  globe: GlobeHemisphereEast,
  star: Star,
  check: Check,
  back: ArrowLeft,
  forward: ArrowRight,
  up: CaretUp,
  down: CaretDown,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS | 'beast';

const SIZES = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 } as const;
export type IconSize = keyof typeof SIZES;

interface Props extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  name: IconName;
  size?: IconSize;
  weight?: IconWeight;
  /** Only when the icon is the sole content; otherwise it is decorative and hidden. */
  label?: string;
}

export function Icon({ name, size = 'md', weight = 'fill', label, className, ...rest }: Props) {
  const px = SIZES[size];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  if (name === 'beast') {
    // The "Beast" reaction is the brand's wolf, as in the app.
    return (
      <svg width={px} height={px} viewBox={`0 0 ${WOLF_SIZE.width} ${WOLF_SIZE.height}`} fill="currentColor" className={`flex-none ${className ?? ''}`} {...a11y} {...rest}>
        {WOLF_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  }
  const Glyph = ICONS[name];
  return <Glyph size={px} weight={weight} className={`flex-none ${className ?? ''}`} {...a11y} {...(rest as object)} />;
}
