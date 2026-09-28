// Pack patches: the brand's neon mascots, cropped to the head and shown on a
// deep-teal circle in both board appearances (the art only works on dark grounds).
// Source: assets/images/animals/<Animal>/1.png (Operation Beast "On Black Neon" set).
export const PATCHES: Record<string, any> = {
  wolf: require('../../../assets/images/patch-wolf.png'),
  eagle: require('../../../assets/images/patch-eagle.png'),
  tiger: require('../../../assets/images/patch-tiger.png'),
  rhino: require('../../../assets/images/patch-rhino.png'),
};

export function patchFor(animal?: string | null) {
  return PATCHES[(animal || '').toLowerCase()] ?? PATCHES.wolf;
}
