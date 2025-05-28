-- Çalışma oturumları tablosu
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    duration INTEGER DEFAULT 0, -- dakika cinsinden
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikalarını etkinleştir
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Users can view own study sessions" ON study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcı istatistikleri tablosu
CREATE TABLE IF NOT EXISTS user_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    total_rooms_joined INTEGER DEFAULT 0,
    total_study_minutes INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Her kullanıcı için tek bir istatistik kaydı olacak
);

-- RLS politikalarını etkinleştir
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Users can view own statistics" ON user_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON user_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics" ON user_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcı odaya katıldığında istatistikleri güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_user_room_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Kullanıcının istatistik kaydı var mı kontrol et
    IF NOT EXISTS (SELECT 1 FROM user_statistics WHERE user_id = NEW.user_id) THEN
        -- Yoksa yeni kayıt oluştur
        INSERT INTO user_statistics (user_id, email, total_rooms_joined)
        SELECT NEW.user_id, auth.users.email, 1
        FROM auth.users
        WHERE auth.users.id = NEW.user_id;
    ELSE
        -- Varsa güncelle
        UPDATE user_statistics
        SET 
            total_rooms_joined = total_rooms_joined + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Odaya katılma trigger'ı
CREATE TRIGGER on_room_join
    AFTER INSERT ON room_users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_room_statistics();

-- Çalışma süresini güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_study_minutes(user_id_param UUID, minutes_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Önce study_sessions tablosuna kayıt ekle
    INSERT INTO study_sessions (user_id, duration)
    VALUES (user_id_param, minutes_param);

    -- Sonra user_statistics tablosunu güncelle
    UPDATE user_statistics
    SET 
        total_study_minutes = total_study_minutes + minutes_param,
        updated_at = NOW()
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut kullanıcıların istatistiklerini oluştur
INSERT INTO user_statistics (user_id, email, total_rooms_joined, total_study_minutes)
SELECT 
    u.id,
    u.email,
    COUNT(DISTINCT ru.room_id) as total_rooms,
    COALESCE(SUM(ss.duration), 0) as total_minutes
FROM auth.users u
LEFT JOIN room_users ru ON u.id = ru.user_id
LEFT JOIN study_sessions ss ON u.id = ss.user_id
GROUP BY u.id, u.email
ON CONFLICT (user_id) DO UPDATE
SET 
    total_rooms_joined = EXCLUDED.total_rooms_joined,
    total_study_minutes = EXCLUDED.total_study_minutes,
    updated_at = NOW(); 