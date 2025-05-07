-- Profil fotoğrafları için storage bucket oluştur
INSERT INTO
  storage.buckets (id, name, public)
VALUES
  ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Profil fotoğrafları için güvenlik politikası oluştur
CREATE POLICY "Herkes profil fotoğraflarını görebilir" ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

-- Kullanıcıların kendi profil fotoğraflarını yüklemesine izin ver
CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını yükleyebilir" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);

-- Kullanıcıların kendi profil fotoğraflarını güncellemesine izin ver
CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını güncelleyebilir" ON storage.objects FOR UPDATE
  USING (bucket_id = 'profiles' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);

-- Kullanıcıların kendi profil fotoğraflarını silmesine izin ver
CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını silebilir" ON storage.objects FOR DELETE
  USING (bucket_id = 'profiles' AND auth.uid() = owner); 