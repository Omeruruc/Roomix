-- Add room_type and video_url columns to rooms table
ALTER TABLE public.rooms ADD COLUMN room_type text NOT NULL DEFAULT 'study';
ALTER TABLE public.rooms ADD COLUMN video_url text;

-- Create an index on room_type for faster filtering
CREATE INDEX rooms_room_type_idx ON public.rooms(room_type);

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Anyone can read rooms" ON public.rooms;
CREATE POLICY "Anyone can read rooms" 
ON public.rooms FOR SELECT 
USING (true);

-- Add comment to columns
COMMENT ON COLUMN public.rooms.room_type IS 'Type of room: study or watch';
COMMENT ON COLUMN public.rooms.video_url IS 'URL of video to watch in watch room type';

-- Add check constraint to ensure room_type is either study or watch
ALTER TABLE public.rooms ADD CONSTRAINT check_room_type CHECK (room_type IN ('study', 'watch'));

-- Add constraint to ensure video_url is not null when room_type is watch
ALTER TABLE public.rooms ADD CONSTRAINT check_video_url CHECK (
  (room_type = 'study') OR (room_type = 'watch' AND video_url IS NOT NULL)
); 