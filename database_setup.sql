-- Kullanıcı istatistikleri tablosu oluştur
CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_rooms_joined INTEGER DEFAULT 0,
  total_study_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS (Row Level Security) politikalarını etkinleştir
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi istatistiklerini görebilir
CREATE POLICY "Users can view own statistics" ON user_statistics
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi istatistiklerini güncelleyebilir
CREATE POLICY "Users can update own statistics" ON user_statistics
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi istatistiklerini oluşturabilir
CREATE POLICY "Users can insert own statistics" ON user_statistics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcının katıldığı oda sayısını artıran fonksiyon
CREATE OR REPLACE FUNCTION increment_user_rooms_joined(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Eğer kullanıcının istatistik kaydı yoksa oluştur
  INSERT INTO user_statistics (user_id, total_rooms_joined)
  VALUES (user_id_param, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_rooms_joined = user_statistics.total_rooms_joined + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının çalışma dakikasını artıran fonksiyon
CREATE OR REPLACE FUNCTION increment_user_study_minutes(user_id_param UUID, minutes_param INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Eğer kullanıcının istatistik kaydı yoksa oluştur
  INSERT INTO user_statistics (user_id, total_study_minutes)
  VALUES (user_id_param, minutes_param)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_study_minutes = user_statistics.total_study_minutes + minutes_param,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Profiles tablosu oluştur
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikalarını etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
DO $$ 
BEGIN
  -- Eğer politika yoksa oluştur
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles" ON profiles
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Yeni kullanıcı kaydı olduğunda otomatik olarak profiles tablosuna kayıt ekleyen fonksiyon
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni kullanıcı kaydı trigger'ı
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Updated_at otomatik güncelleme trigger'ı
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 