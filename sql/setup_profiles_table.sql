-- Profiller tablosunun oluşturulması
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  fullname TEXT,
  PRIMARY KEY (id)
);

-- Profilleri yönetme politikası
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcıların kendi profillerini görüntülemesine izin veren politika
CREATE POLICY "Herkes profilleri görebilir" ON profiles
  FOR SELECT USING (true);

-- Kullanıcıların kendi profillerini güncelleme politikası
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Kullanıcıların kendi profillerini oluşturabilme politikası
CREATE POLICY "Kullanıcılar kendi profillerini oluşturabilir" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Gerçek zamanlı bildirimler için fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, updated_at)
  VALUES (NEW.id, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni kullanıcılar için trigger oluşturma
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 