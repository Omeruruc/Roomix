-- Yeni kullanıcı kaydı olduğunda otomatik olarak profiles tablosuna kayıt ekleyen fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eğer trigger zaten varsa kaldır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Yeni kullanıcı kaydı trigger'ı
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Mevcut kullanıcılar için profiles tablosuna kayıt ekle
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING; 