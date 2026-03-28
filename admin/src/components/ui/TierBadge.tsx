interface TierBadgeProps {
  tier: string | null | undefined;
  size?: 'sm' | 'xs';
}

const TIER_STYLES: Record<string, string> = {
  untamed: 'bg-yellow-100 text-yellow-700',
  forged: 'bg-cyan-100 text-cyan-700',
  raw: 'bg-gray-100 text-gray-600',
};

export default function TierBadge({ tier, size = 'xs' }: TierBadgeProps) {
  if (!tier) return null;
  const style = TIER_STYLES[tier] || 'bg-gray-100 text-gray-600';
  const sizeClass = size === 'sm' ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5';
  return (
    <span className={`font-medium rounded-full capitalize ${sizeClass} ${style}`}>
      {tier}
    </span>
  );
}
