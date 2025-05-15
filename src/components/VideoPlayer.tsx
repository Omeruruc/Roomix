import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Loader, MessageSquare } from 'lucide-react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import Chat from './Chat';

interface VideoPlayerProps {
  session: Session;
  roomId: string;
  videoUrl: string;
}

interface VideoState {
  isPlaying: boolean;
  played: number;
  loaded: number;
  duration: number;
  timestamp: number;
  user_id: string;
  room_id: string;
}

export default function VideoPlayer({ session, roomId, videoUrl }: VideoPlayerProps) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [playPauseByMe, setPlayPauseByMe] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingState, setLoadingState] = useState("initializing");
  
  const playerRef = useRef<ReactPlayer>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const seekChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video senkronizasyonu için effect
  useEffect(() => {
    if (!roomId || !isReady) return;

    const videoStateChannel = supabase
      .channel(`room-video-${roomId}`)
      .on(
        'broadcast',
        { event: 'video-state-change' },
        payload => {
          if (payload.payload.user_id === session.user.id) return;

          const videoState: VideoState = payload.payload;
          
          if (seeking) return;

          // Oynatma/durdurma durumu değiştiğinde
          if (videoState.isPlaying !== isPlaying) {
            setIsPlaying(videoState.isPlaying);
          }

          // Atlama değişikliği yapıldığında (10 saniyeden fazla fark varsa)
          const currentTime = playerRef.current?.getCurrentTime() || 0;
          const diff = Math.abs(videoState.timestamp - currentTime);
          
          if (diff > 3) {
            playerRef.current?.seekTo(videoState.timestamp);
          }
        }
      )
      .subscribe();

    return () => {
      videoStateChannel.unsubscribe();
    };
  }, [roomId, isPlaying, seeking, isReady, session.user.id]);

  // Video durumunu yayınlama fonksiyonu
  const broadcastVideoState = (state: Partial<VideoState>) => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    throttleRef.current = setTimeout(() => {
      if (!roomId || !isReady) return;

      const currentTime = playerRef.current?.getCurrentTime() || 0;

      const videoState: VideoState = {
        isPlaying,
        played,
        loaded,
        duration,
        timestamp: currentTime,
        user_id: session.user.id,
        room_id: roomId,
        ...state
      };

      supabase
        .channel(`room-video-${roomId}`)
        .send({
          type: 'broadcast',
          event: 'video-state-change',
          payload: videoState
        });
    }, 300);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const handlePlayPause = () => {
    setPlayPauseByMe(true);
    setIsPlaying(!isPlaying);
    broadcastVideoState({ isPlaying: !isPlaying });
  };

  const handleProgress = (state: { played: number; loaded: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPlayed(value);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    setSeeking(false);
    playerRef.current?.seekTo(value);
    
    if (seekChangeTimeoutRef.current) {
      clearTimeout(seekChangeTimeoutRef.current);
    }
    
    seekChangeTimeoutRef.current = setTimeout(() => {
      broadcastVideoState({ timestamp: playerRef.current?.getCurrentTime() || 0 });
    }, 200);
  };

  const handleReady = () => {
    console.log("Video player is ready");
    setIsReady(true);
    setLoadingState("ready");
  };

  const skipForward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    const newTime = Math.min(currentTime + 10, duration);
    playerRef.current?.seekTo(newTime);
    broadcastVideoState({ timestamp: newTime });
  };

  const skipBackward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    const newTime = Math.max(currentTime - 10, 0);
    playerRef.current?.seekTo(newTime);
    broadcastVideoState({ timestamp: newTime });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setMuted(value === 0);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const handleFullscreen = () => {
    const videoElement = document.getElementById('video-container');
    if (!videoElement) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoElement.requestFullscreen();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <h1 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent`}>
          Video İzleme Odası
        </h1>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowChat(!showChat)}
          className={`px-4 py-2 ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-500' 
              : 'bg-blue-500 hover:bg-blue-400'
          } rounded-xl font-medium text-white shadow-md transition-all duration-200 flex items-center gap-2`}
        >
          <MessageSquare className="w-5 h-5" />
          {showChat ? 'Video Oynatıcı' : 'Sohbeti Göster'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${showChat ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div 
            id="video-container"
            className={`relative overflow-hidden rounded-2xl shadow-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            {(!isReady || loadingState === "initializing") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-white text-lg">Video yükleniyor...</p>
              </div>
            )}
            
            <div className="aspect-video">
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                volume={volume}
                muted={muted}
                onReady={handleReady}
                onProgress={handleProgress}
                onDuration={setDuration}
                onPlay={() => {
                  if (!playPauseByMe) return;
                  setIsPlaying(true);
                  setPlayPauseByMe(false);
                }}
                onPause={() => {
                  if (!playPauseByMe) return;
                  setIsPlaying(false);
                  setPlayPauseByMe(false);
                }}
                onError={(e: Error) => {
                  console.error("Video player error:", e);
                  toast.error("Video yüklenirken bir hata oluştu");
                  setLoadingState("error");
                }}
                config={{
                  youtube: {
                    playerVars: { 
                      disablekb: 1,
                      modestbranding: 1
                    }
                  }
                }}
              />
            </div>

            {/* Video Player Kontrolleri */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t ${
              theme === 'dark' ? 'from-black/80 to-transparent' : 'from-black/70 to-transparent'
            } transition-opacity duration-300`}>
              {/* İlerleme çubuğu */}
              <div className="mb-2 relative">
                <div className="absolute left-0 right-0 h-1 bg-gray-600 rounded-full">
                  <div
                    className="absolute h-1 bg-gray-400 rounded-full"
                    style={{ width: `${loaded * 100}%` }}
                  ></div>
                  <div
                    className="absolute h-1 bg-blue-500 rounded-full"
                    style={{ width: `${played * 100}%` }}
                  ></div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.999999}
                  step="any"
                  value={played}
                  onChange={handleSeekChange}
                  onMouseDown={handleSeekMouseDown}
                  onMouseUp={handleSeekMouseUp}
                  className="w-full h-2 absolute opacity-0 cursor-pointer"
                />
              </div>

              {/* Zaman ve kontroller */}
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePlayPause} 
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={skipBackward} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={skipForward} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <div className="text-white text-sm ml-2">
                    {formatTime(playerRef.current?.getCurrentTime() || 0)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative hidden sm:flex items-center">
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                      {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <div className="w-[80px] mx-2">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step="any"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleFullscreen}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className={`p-4 rounded-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h2 className="text-lg font-semibold mb-2">Video Hakkında</h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Bu video oda yöneticisi tarafından paylaşılmıştır. Herkes videoyu eş zamanlı olarak izleyebilir.
                Play/Pause, ileri-geri sarma gibi işlemleri yapabilirsiniz ve bu kontroller odadaki herkes için senkronize olacaktır.
              </p>
            </div>
          </div>
        </div>

        {showChat && (
          <div className="lg:col-span-1">
            <Chat session={session} roomId={roomId} />
          </div>
        )}
      </div>
    </div>
  );
} 