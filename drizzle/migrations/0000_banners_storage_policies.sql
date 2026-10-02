CREATE POLICY "admins manage banners" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));