-- One-off, live only (2026-10-06): undo a parallel version of 083 applied by another session before
-- the canonical 083_partner_level_community_about.sql. Its columns held no data.
ALTER TABLE public.partner_profiles DROP COLUMN IF EXISTS work_style, DROP COLUMN IF EXISTS group_size, DROP COLUMN IF EXISTS goals, DROP COLUMN IF EXISTS show_level;
DROP FUNCTION IF EXISTS public.community_leaders(TEXT);
DROP FUNCTION IF EXISTS public.find_partners(text[], text, integer, uuid);
