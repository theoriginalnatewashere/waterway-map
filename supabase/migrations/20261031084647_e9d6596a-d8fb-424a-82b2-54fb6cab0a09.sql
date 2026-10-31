CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT CASE WHEN auth.uid() IS NOT NULL AND _user_id = auth.uid()
 THEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role)
 ELSE false END
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "dispensers public read visible" ON public.dispensers;
CREATE POLICY "dispensers public read visible" ON public.dispensers FOR SELECT TO anon USING (NOT is_hidden);
CREATE POLICY "dispensers authenticated read" ON public.dispensers FOR SELECT TO authenticated USING (NOT is_hidden OR auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
DROP POLICY "reports public read visible" ON public.water_quality_reports;
CREATE POLICY "reports public read visible" ON public.water_quality_reports FOR SELECT TO anon USING (NOT is_hidden AND EXISTS (SELECT 1 FROM public.dispensers d WHERE d.id = dispenser_id AND NOT d.is_hidden));
CREATE POLICY "reports authenticated read" ON public.water_quality_reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR (NOT is_hidden AND EXISTS (SELECT 1 FROM public.dispensers d WHERE d.id = dispenser_id AND NOT d.is_hidden)));
ALTER POLICY "reports auth create" ON public.water_quality_reports WITH CHECK (auth.uid() = user_id AND tested_directly_from_outlet AND NOT is_hidden AND EXISTS (SELECT 1 FROM public.dispensers d WHERE d.id = dispenser_id AND NOT d.is_hidden));

CREATE OR REPLACE FUNCTION public.protect_report_moderation_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NEW.tested_directly_from_outlet IS DISTINCT FROM OLD.tested_directly_from_outlet THEN RAISE EXCEPTION 'tested_directly_from_outlet is immutable'; END IF;
 IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN RAISE EXCEPTION 'Only admins can change is_hidden'; END IF;
 IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'user_id is immutable'; END IF;
 IF NEW.dispenser_id IS DISTINCT FROM OLD.dispenser_id THEN RAISE EXCEPTION 'dispenser_id is immutable'; END IF;
 RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.protect_report_moderation_fields() FROM PUBLIC, anon, authenticated;

ALTER POLICY "dispenser-images read" ON storage.objects USING (
 bucket_id = 'dispenser-images' AND (
 (auth.uid()::text = owner_id AND auth.uid()::text = (storage.foldername(name))[1])
 OR EXISTS (SELECT 1 FROM public.dispensers d WHERE storage.objects.name = ANY(d.image_urls))
 OR EXISTS (SELECT 1 FROM public.water_quality_reports r WHERE storage.objects.name = ANY(r.image_urls))
 ));
ALTER POLICY "dispenser-images insert own folder" ON storage.objects WITH CHECK (bucket_id = 'dispenser-images' AND auth.uid()::text = owner_id AND auth.uid()::text = (storage.foldername(name))[1] AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
ALTER POLICY "dispenser-images update own" ON storage.objects USING (bucket_id = 'dispenser-images' AND auth.uid()::text = owner_id AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'dispenser-images' AND auth.uid()::text = owner_id AND auth.uid()::text = (storage.foldername(name))[1] AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
ALTER POLICY "dispenser-images delete own or admin" ON storage.objects USING (bucket_id = 'dispenser-images' AND ((auth.uid()::text = owner_id AND auth.uid()::text = (storage.foldername(name))[1]) OR public.has_role(auth.uid(),'admin')));

CREATE FUNCTION public.protect_image_attachments() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE path text; previous text[] := '{}';
BEGIN
 IF TG_OP = 'UPDATE' THEN previous := OLD.image_urls; END IF;
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 FOREACH path IN ARRAY NEW.image_urls LOOP
  IF path = ANY(previous) THEN CONTINUE; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'dispenser-images' AND o.name = path AND o.owner_id = auth.uid()::text AND split_part(o.name,'/',1) = auth.uid()::text) THEN
   RAISE EXCEPTION 'Only your own uploaded photos can be attached';
  END IF;
 END LOOP;
 RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.protect_image_attachments() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER dispensers_protect_images BEFORE INSERT OR UPDATE OF image_urls ON public.dispensers FOR EACH ROW EXECUTE FUNCTION public.protect_image_attachments();
CREATE TRIGGER reports_protect_images BEFORE INSERT OR UPDATE OF image_urls ON public.water_quality_reports FOR EACH ROW EXECUTE FUNCTION public.protect_image_attachments();