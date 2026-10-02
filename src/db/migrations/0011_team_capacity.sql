CREATE FUNCTION uludott_team_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE max_size integer; current_size integer;
BEGIN
 SELECT max_team_size INTO max_size FROM events WHERE id=NEW.event_id FOR SHARE;
 IF NEW.expected_size > max_size OR length(btrim(NEW.name))>100 THEN RAISE EXCEPTION 'team bounds' USING ERRCODE='23514'; END IF;
 NEW.normalized_name := lower(translate(regexp_replace(btrim(normalize(NEW.name,NFKC)), '[[:space:]]+', ' ', 'g'), 'Iİ', 'ıi'));
 SELECT count(*) INTO current_size FROM memberships WHERE team_id=NEW.id AND left_at IS NULL;
 IF current_size>NEW.expected_size THEN RAISE EXCEPTION 'team capacity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER team_size_name_guard BEFORE INSERT OR UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION uludott_team_guard();
--> statement-breakpoint
CREATE FUNCTION uludott_membership_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE limit_size integer; current_size integer; old_team uuid;
BEGIN
 IF TG_OP='UPDATE' THEN old_team:=OLD.team_id; END IF;
 PERFORM 1 FROM teams WHERE id IN (NEW.team_id,old_team) ORDER BY id FOR NO KEY UPDATE;
 IF NEW.left_at IS NULL THEN
 SELECT expected_size INTO limit_size FROM teams WHERE id=NEW.team_id AND event_id=NEW.event_id;
 SELECT count(*) INTO current_size FROM memberships WHERE team_id=NEW.team_id AND left_at IS NULL AND id<>NEW.id;
 IF current_size>=limit_size THEN RAISE EXCEPTION 'team capacity' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER membership_capacity_guard AFTER INSERT OR UPDATE ON memberships DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION uludott_membership_capacity();
--> statement-breakpoint
CREATE FUNCTION uludott_event_team_limit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM teams WHERE event_id=NEW.id AND expected_size>NEW.max_team_size) THEN RAISE EXCEPTION 'existing team exceeds event limit' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER event_team_limit_guard BEFORE UPDATE OF max_team_size ON events FOR EACH ROW EXECUTE FUNCTION uludott_event_team_limit();
