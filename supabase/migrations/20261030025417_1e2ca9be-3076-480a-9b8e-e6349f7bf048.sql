CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text CHECK (display_name IS NULL OR char_length(display_name) <= 80),
  full_name text CHECK (full_name IS NULL OR char_length(full_name) <= 120),
  avatar_url text,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','th')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lang text := lower(coalesce(NEW.raw_user_meta_data->>'language','en'));
BEGIN
  IF _lang NOT IN ('en','th') THEN _lang := 'en'; END IF;
  INSERT INTO public.profiles (id, full_name, display_name, avatar_url, language)
  VALUES (NEW.id,
    left(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), 120),
    left(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), 80),
    NEW.raw_user_meta_data->>'avatar_url', _lang)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "roles select own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.dispensers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  address text CHECK (address IS NULL OR char_length(address) <= 300),
  location_description text CHECK (location_description IS NULL OR char_length(location_description) <= 500),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  operating_status text NOT NULL DEFAULT 'unknown' CHECK (operating_status IN ('working','out_of_service','unknown')),
  image_urls text[] NOT NULL DEFAULT '{}' CHECK (cardinality(image_urls) <= 6),
  created_by uuid NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dispensers_created_by_idx ON public.dispensers (created_by);
GRANT SELECT ON public.dispensers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispensers TO authenticated;
GRANT ALL ON public.dispensers TO service_role;
ALTER TABLE public.dispensers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dispensers public read visible" ON public.dispensers FOR SELECT TO anon, authenticated
  USING (is_hidden = false OR auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "dispensers auth create" ON public.dispensers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND is_hidden = false);
CREATE POLICY "dispensers owner or admin update" ON public.dispensers FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "dispensers admin delete" ON public.dispensers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.protect_dispenser_moderation_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN RAISE EXCEPTION 'Only admins can change is_hidden'; END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN RAISE EXCEPTION 'created_by is immutable'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER dispensers_protect_moderation BEFORE UPDATE ON public.dispensers FOR EACH ROW EXECUTE FUNCTION public.protect_dispenser_moderation_fields();
CREATE TRIGGER dispensers_set_updated_at BEFORE UPDATE ON public.dispensers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.water_quality_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispenser_id uuid NOT NULL REFERENCES public.dispensers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ph_level numeric NOT NULL CHECK (ph_level BETWEEN 0 AND 14),
  tds_ppm integer NOT NULL CHECK (tds_ppm BETWEEN 0 AND 5000),
  tested_at timestamptz NOT NULL,
  water_temperature_c numeric CHECK (water_temperature_c IS NULL OR water_temperature_c BETWEEN -10 AND 100),
  meter_model text CHECK (meter_model IS NULL OR char_length(meter_model) <= 120),
  dispenser_status text NOT NULL DEFAULT 'unknown' CHECK (dispenser_status IN ('working','out_of_service','unknown')),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  image_urls text[] NOT NULL DEFAULT '{}' CHECK (cardinality(image_urls) <= 6),
  tested_directly_from_outlet boolean NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wqr_dispenser_tested_idx ON public.water_quality_reports (dispenser_id, tested_at DESC);
CREATE INDEX wqr_user_idx ON public.water_quality_reports (user_id);
GRANT SELECT ON public.water_quality_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_quality_reports TO authenticated;
GRANT ALL ON public.water_quality_reports TO service_role;
ALTER TABLE public.water_quality_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports public read visible" ON public.water_quality_reports FOR SELECT TO anon, authenticated
  USING (is_hidden = false OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports auth create" ON public.water_quality_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND tested_directly_from_outlet = true AND is_hidden = false);
CREATE POLICY "reports owner or admin update" ON public.water_quality_reports FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports owner or admin delete" ON public.water_quality_reports FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.protect_report_moderation_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN RAISE EXCEPTION 'Only admins can change is_hidden'; END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'user_id is immutable'; END IF;
  IF NEW.dispenser_id IS DISTINCT FROM OLD.dispenser_id THEN RAISE EXCEPTION 'dispenser_id is immutable'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER wqr_protect_moderation BEFORE UPDATE ON public.water_quality_reports FOR EACH ROW EXECUTE FUNCTION public.protect_report_moderation_fields();
CREATE TRIGGER wqr_set_updated_at BEFORE UPDATE ON public.water_quality_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "dispenser-images read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'dispenser-images');
CREATE POLICY "dispenser-images insert own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dispenser-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "dispenser-images update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dispenser-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'dispenser-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "dispenser-images delete own or admin" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dispenser-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_dispenser_moderation_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_report_moderation_fields() FROM PUBLIC, anon, authenticated;