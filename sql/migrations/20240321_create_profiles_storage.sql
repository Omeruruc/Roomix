-- Profil ve kapak fotoğrafları için storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Güvenlik politikalarını güncelle
DO $$ 
BEGIN
    -- Eski politikaları temizle
    DROP POLICY IF EXISTS "Herkes profil fotoğraflarını görebilir" ON storage.objects;
    DROP POLICY IF EXISTS "Kullanıcılar kendi profil fotoğraflarını yükleyebilir" ON storage.objects;
    DROP POLICY IF EXISTS "Kullanıcılar kendi profil fotoğraflarını güncelleyebilir" ON storage.objects;
    DROP POLICY IF EXISTS "Kullanıcılar kendi profil fotoğraflarını silebilir" ON storage.objects;

    -- Yeni politikaları oluştur
    CREATE POLICY "Herkes profil fotoğraflarını görebilir" 
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profiles');

    CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını yükleyebilir" 
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profiles' 
        AND auth.uid() = owner
        AND (
            (storage.foldername(name))[1] = 'avatars' OR 
            (storage.foldername(name))[1] = 'covers'
        )
    );

    CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını güncelleyebilir" 
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profiles' 
        AND auth.uid() = owner
        AND (
            (storage.foldername(name))[1] = 'avatars' OR 
            (storage.foldername(name))[1] = 'covers'
        )
    )
    WITH CHECK (
        bucket_id = 'profiles' 
        AND auth.uid() = owner
        AND (
            (storage.foldername(name))[1] = 'avatars' OR 
            (storage.foldername(name))[1] = 'covers'
        )
    );

    CREATE POLICY "Kullanıcılar kendi profil fotoğraflarını silebilir" 
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profiles' 
        AND auth.uid() = owner
        AND (
            (storage.foldername(name))[1] = 'avatars' OR 
            (storage.foldername(name))[1] = 'covers'
        )
    );
END $$;

-- RLS'yi etkinleştir
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Bucket ayarlarını güncelle
UPDATE storage.buckets
SET 
    public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'profiles';

-- Profiles tablosunu güncelle
DO $$ 
BEGIN
    -- Eğer avatar_url ve cover_image_url kolonları yoksa ekle
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'cover_image_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN cover_image_url TEXT;
    END IF;

    -- RLS politikalarını güncelle
    DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON profiles;
    
    CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

    -- RLS'yi etkinleştir
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
END $$; 