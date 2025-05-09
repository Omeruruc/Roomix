-- users_fullname tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.users_fullname (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Satır bazlı güvenlik politikası (Row Level Security) etkinleştir
ALTER TABLE public.users_fullname ENABLE ROW LEVEL SECURITY;

-- Herkesin okuma yapabilmesi için politika
CREATE POLICY "Herkes tüm kullanıcı isimlerini görebilir" ON public.users_fullname
  FOR SELECT USING (true);

-- Kullanıcıların kendi bilgilerini güncelleme politikası
CREATE POLICY "Kullanıcılar kendi isim bilgilerini güncelleyebilir" ON public.users_fullname
  FOR UPDATE USING (auth.uid() = id);

-- Kullanıcıların kendi bilgilerini oluşturabilme politikası
CREATE POLICY "Kullanıcılar kendi isim bilgilerini oluşturabilir" ON public.users_fullname
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Yeni kullanıcı kaydı olduğunda otomatik olarak kayıt oluşturacak trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user_fullname()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_fullname (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni kullanıcılar için trigger 
DROP TRIGGER IF EXISTS on_auth_user_created_fullname ON auth.users;
CREATE TRIGGER on_auth_user_created_fullname
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_fullname(); 