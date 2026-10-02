-- Published snapshots are sealed. Corrections require a new version.
CREATE FUNCTION protect_published_form_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    RAISE EXCEPTION 'Published form version is immutable' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER form_version_immutable BEFORE UPDATE OR DELETE ON form_versions
FOR EACH ROW EXECUTE FUNCTION protect_published_form_version();
--> statement-breakpoint
-- Lock every involved parent in UUID order, including both sides of a moved row.
-- This serializes child writes with publication and prevents moving sealed fields.
CREATE FUNCTION protect_published_form_child() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_parent uuid;
  new_parent uuid;
  parent record;
BEGIN
  IF TG_OP != 'INSERT' THEN old_parent := OLD.version_id; END IF;
  IF TG_OP != 'DELETE' THEN new_parent := NEW.version_id; END IF;
  FOR parent IN SELECT id, published_at FROM form_versions
    WHERE id = old_parent OR id = new_parent ORDER BY id FOR UPDATE
  LOOP
    IF parent.published_at IS NOT NULL THEN
      RAISE EXCEPTION 'Published form version children are immutable' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER form_field_immutable BEFORE INSERT OR UPDATE OR DELETE ON form_fields
FOR EACH ROW EXECUTE FUNCTION protect_published_form_child();
--> statement-breakpoint
CREATE TRIGGER form_rule_immutable BEFORE INSERT OR UPDATE OR DELETE ON form_rules
FOR EACH ROW EXECUTE FUNCTION protect_published_form_child();
