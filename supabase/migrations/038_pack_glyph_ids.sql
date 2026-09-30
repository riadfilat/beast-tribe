-- 038: Pack patches now use professionally drawn glyphs (game-icons.net, CC BY 3.0).
-- "tiger" is a real glyph again; leopard, oryx and phoenix were retired.
-- Old writers that send only `animal` still land on a valid glyph.

CREATE OR REPLACE FUNCTION bt_packs_emblem() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.emblem_kind = 'glyph' THEN
    IF NEW.emblem_value IS NULL OR (TG_OP = 'UPDATE' AND NEW.animal IS DISTINCT FROM OLD.animal AND NEW.emblem_value IS NOT DISTINCT FROM OLD.emblem_value) THEN
      NEW.emblem_value := lower(coalesce(NEW.animal, ''));
    END IF;
    NEW.emblem_value := CASE NEW.emblem_value
      WHEN 'eagle' THEN 'falcon'
      WHEN 'leopard' THEN 'tiger'
      WHEN 'oryx' THEN 'ibex'
      WHEN 'phoenix' THEN 'griffin'
      WHEN '' THEN 'wolf'
      ELSE NEW.emblem_value END;
    IF NEW.emblem_value !~ '^[a-z]{2,16}$' THEN
      NEW.emblem_value := 'wolf';
    END IF;
    NEW.animal := NEW.emblem_value;
  END IF;
  RETURN NEW;
END $$;

-- Existing rows: the trigger above rewrites the retired ids on this no-op update.
UPDATE packs SET emblem_value = emblem_value
WHERE emblem_kind = 'glyph' AND emblem_value IN ('leopard', 'oryx', 'phoenix', 'eagle');
