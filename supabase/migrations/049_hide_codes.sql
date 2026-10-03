-- 049 Hide invite codes at the table level — APPLY ONLY AFTER build 9 (the Apple Health build) is the
-- build everyone runs. Builds up to 8 read packs.invite_code and communities.join_code directly and would
-- fail. From build 9 the app gets codes only through pack_invite_code() / community_invite_code() (048).

-- Codes are no longer readable straight from the tables; the functions above hand them to the
-- people allowed to share them. (A new column on packs/communities needs adding to these grants.)
REVOKE SELECT ON packs FROM anon, authenticated;
GRANT SELECT (id, name, animal, icon_url, created_at, created_by, is_system, description, max_members, community_id,
  is_community_default, emblem_kind, emblem_value, emblem_color, audience) ON packs TO authenticated;
REVOKE SELECT ON communities FROM anon, authenticated;
GRANT SELECT (id, name, slug, description, logo_url, cover_url, country, city, is_active, created_at, updated_at,
  visibility, kind, seat_limit, contract_ends_at, is_default) ON communities TO authenticated;

