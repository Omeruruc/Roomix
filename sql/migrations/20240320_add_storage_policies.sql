-- Profil fotoğrafları için storage bucket oluştur
INSERT INTO
  storage.buckets (id, name, public)
VALUES
  ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Profil fotoğrafları için güvenlik politikaları
DO $$ 
BEGIN
  -- Herkes profil fotoğraflarını görebilir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Herkes profil fotoğraflarını görebilir'
  ) THEN
    CREATE POLICY "Herkes profil fotoğraflarını görebilir" ON storage.objects FOR SELECT
      USING (bucket_id = 'profiles');
  END IF;

  -- Kullanıcıların kendi profil fotoğraflarını yüklemesine izin ver
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Kullanıcılar kendi profil fotoğraflarını yükleyebilir'
  ) THEN
    CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını yükleyebilir" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);
  END IF;

  -- Kullanıcıların kendi profil fotoğraflarını güncellemesine izin ver
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Kullanıcılar kendi profil fotoğraflarını güncelleyebilir'
  ) THEN
    CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını güncelleyebilir" ON storage.objects FOR UPDATE
      USING (bucket_id = 'profiles' AND auth.uid() = owner)
      WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);
  END IF;

  -- Kullanıcıların kendi profil fotoğraflarını silmesine izin ver
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Kullanıcılar kendi profil fotoğraflarını silebilir'
  ) THEN
    CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını silebilir" ON storage.objects FOR DELETE
      USING (bucket_id = 'profiles' AND auth.uid() = owner);
  END IF;
END $$; 