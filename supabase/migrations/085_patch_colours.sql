-- 085: more group badge colours (black first: black, black & orange, black & aqua; graphite, navy,
-- sand, olive, coral). Badge icons need no change here: any lowercase id is accepted.
ALTER TABLE public.packs DROP CONSTRAINT IF EXISTS packs_emblem_color_chk;
ALTER TABLE public.packs ADD CONSTRAINT packs_emblem_color_chk CHECK (emblem_color = ANY (ARRAY[
  'slate', 'dreamer', 'seeker', 'aqua', 'orange', 'chalk', 'blush', 'rose',
  'night', 'ember', 'frost', 'steel', 'navy', 'sand', 'olive', 'coral'
]::text[]));
