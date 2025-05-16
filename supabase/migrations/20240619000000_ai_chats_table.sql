-- AI chat mesajları tablosu
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_ai BOOLEAN NOT NULL DEFAULT FALSE
);

-- AI chats tablosu için RLS politikaları
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

-- Sadece kendi ai chat mesajlarını görebilme (okuma) politikası
CREATE POLICY "User can view their own ai chats" 
  ON ai_chats 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Kendi ai chat mesajlarını oluşturabilme (yazma) politikası
CREATE POLICY "User can create ai chats" 
  ON ai_chats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Kendi ai chat mesajlarını silebilme politikası
CREATE POLICY "User can delete their own ai chats" 
  ON ai_chats 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- AI chats tablosu için indeks oluşturma
CREATE INDEX IF NOT EXISTS ai_chats_user_id_idx ON ai_chats (user_id);
CREATE INDEX IF NOT EXISTS ai_chats_created_at_idx ON ai_chats (created_at);

-- AI Coaching özelliğini kullanmak için storage bucket ve politikası
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-coaching', 'ai-coaching', false)
ON CONFLICT (id) DO NOTHING;

-- AI coaching bucket için RLS
CREATE POLICY "Authenticated users can upload AI coaching files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ai-coaching' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own AI coaching files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'ai-coaching' AND (storage.foldername(name))[1] = auth.uid()::text); 