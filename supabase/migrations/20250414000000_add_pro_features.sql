-- Pro kullanıcı özellikleri için yeni tablo
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  is_pro boolean NOT NULL DEFAULT false,
  promo_code text,
  activated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS politikaları
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi abonelik bilgilerini görebilir
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi aboneliklerini güncelleyebilir (promo kod ile)
CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi aboneliklerini oluşturabilir
CREATE POLICY "Users can insert their own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- updated_at için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Mevcut kullanıcılar için varsayılan kayıt oluştur
INSERT INTO user_subscriptions (user_id, is_pro, created_at)
SELECT id, false, now()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT (user_id) DO NOTHING; 