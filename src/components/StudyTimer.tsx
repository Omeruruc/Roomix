import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

interface StudyTimerProps {
  userId: string;
  userEmail: string;
  roomId: string;
  isCurrentUser?: boolean;
  avatar_url?: string | null;
}

interface TimerState {
  isRunning: boolean;
  time: number;
  subject: string;
}

export default function StudyTimer({ userId, userEmail, roomId, isCurrentUser = false, avatar_url }: StudyTimerProps) {
  const { theme } = useTheme();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    time: 0,
    subject: ''
  });
  const [subject, setSubject] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const lastUpdateRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();
  const localTimeRef = useRef<number>(0);

  // Tüm kronometreler için genel realtime dinleme kanalını oluşturan fonksiyon
  const setupRealtimeSubscription = () => {
    // Oda içindeki tüm timer değişikliklerini dinleyen kanal
    const channel = supabase
      .channel(`room_timers_general:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_timers',
          filter: `room_id=eq.${roomId}` // Tüm oda kronometrelerini dinle
        },
        (payload) => {
          // Değişiklik gerçekleşen kronometreyi kontrol et
          if (payload.new && 'user_id' in payload.new && payload.new.user_id === userId) {
            const newData = payload.new as { 
              is_running: boolean; 
              elapsed_time: number; 
              subject?: string;
              user_id: string;
            };
            
            // Lokal state'i güncelleyerek sayfa yenileme olmadan anında göster
            setTimerState({
              isRunning: Boolean(newData.is_running),
              time: Number(newData.elapsed_time) || 0,
              subject: String(newData.subject || '')
            });
            
            // LocalTime referansını güncelle
            localTimeRef.current = Number(newData.elapsed_time) || 0;
            lastUpdateRef.current = Date.now();
            
            // Kronometre durdurulduğunda ya da başlatıldığında interval'i düzenle
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            
            if (Boolean(newData.is_running)) {
              startInterval();
            }
          }
        }
      )
      .subscribe();
      
    return channel;
  };
  
  // İnterval'i başlatan yardımcı fonksiyon
  const startInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      localTimeRef.current += 1;
      setTimerState(prev => ({
        ...prev,
        time: localTimeRef.current
      }));
      
      // Server güncelleme işlemi aktif kullanıcı için
      if (isCurrentUser && Date.now() - lastUpdateRef.current >= 1000) {
        updateServerTimer(localTimeRef.current, true);
      }
    }, 1000);
  };
  
  // Server'a timer durumunu güncelleyen fonksiyon
  const updateServerTimer = async (elapsedTime: number, isRunning: boolean) => {
    try {
      const { error } = await supabase
        .from('study_timers')
        .upsert({
          user_id: userId,
          room_id: roomId,
          elapsed_time: elapsedTime,
          is_running: isRunning,
          subject: timerState.subject || subject,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,room_id'
        });

      if (error) {
        console.error('Timer güncellenirken hata oluştu:', error);
      } else {
        lastUpdateRef.current = Date.now();
      }
    } catch (error) {
      console.error('Timer güncellenirken hata oluştu:', error);
    }
  };

  useEffect(() => {
    const loadTimerState = async () => {
      const { data, error } = await supabase
        .from('study_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) {
        console.error('Timer verisi alınırken hata oluştu:', error);
        return;
      }

      if (data) {
        setTimerState({
          isRunning: data.is_running,
          time: data.elapsed_time,
          subject: data.subject || ''
        });
        localTimeRef.current = data.elapsed_time;
        setSubject(data.subject || '');
        lastUpdateRef.current = Date.now();
        
        // Timer çalışıyorsa interval'i başlat
        if (data.is_running) {
          startInterval();
        }
      }
    };

    loadTimerState();
    
    // Realtime dinleme kanalı oluştur
    const roomTimersChannel = setupRealtimeSubscription();
    
    // Kullanıcının odadan ayrılması durumunu dinle
    const roomUsersChannel = supabase
      .channel(`room_users:${roomId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_users',
          filter: `room_id=eq.${roomId} AND user_id=eq.${userId}`
        },
        () => {
          setIsVisible(false);
        }
      )
      .subscribe();

    return () => {
      roomTimersChannel.unsubscribe();
      roomUsersChannel.unsubscribe();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [userId, roomId, isCurrentUser]);

  const handleStartStop = async () => {
    if (!isCurrentUser) return;

    if (!timerState.isRunning && !subject.trim() && !timerState.subject) {
      toast.error('Lütfen sayacı başlatmadan önce bir konu girin');
      return;
    }

    const newIsRunning = !timerState.isRunning;
    
    try {
      // Server'a durumu güncelle
      await updateServerTimer(localTimeRef.current, newIsRunning);
      
      // Yerel state'i güncelle
      setTimerState(prev => ({
        ...prev,
        isRunning: newIsRunning,
        subject: subject || prev.subject
      }));
      
      // Interval'i duruma göre başlat veya durdur
      if (newIsRunning) {
        startInterval();
      } else if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Sayaç durumu güncellenemedi');
        console.error('Error updating timer:', error);
      }
    }
  };

  const handleReset = async () => {
    if (!isCurrentUser) return;

    try {
      // Server'ı sıfırla
      await updateServerTimer(0, false);
      
      // Yerel state'i sıfırla
      localTimeRef.current = 0;
      setTimerState(prev => ({
        ...prev,
        time: 0,
        isRunning: false
      }));
      
      // Interval'i durdur
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Sayaç sıfırlanamadı');
        console.error('Error resetting timer:', error);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${
          theme === 'dark'
            ? 'bg-gray-800/50 border-gray-700/50'
            : 'bg-white/80 border-gray-200'
        } p-6 rounded-xl border backdrop-blur-sm`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Clock className={`w-6 h-6 ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`} />
          
          {/* Kullanıcı avatarı */}
          {avatar_url ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-600">
              <img
                src={avatar_url}
                alt={userEmail}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            } border border-gray-600`}>
              <User className="w-4 h-4 text-gray-400" />
            </div>
          )}
          
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{userEmail}'s Çalışma Sayacı</h3>
        </div>

        <div className="space-y-4">
          {isCurrentUser ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={subject || timerState.subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Konu girin..."
                className={`flex-1 px-4 py-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 placeholder-gray-400'
                    : 'bg-gray-100 border-gray-200 placeholder-gray-500'
                } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                disabled={timerState.isRunning}
              />
            </div>
          ) : (
            timerState.subject && (
              <p className={`text-center ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Çalışılan Konu: {timerState.subject}
              </p>
            )
          )}

          <div className={`text-4xl font-bold text-center font-mono ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {formatTime(timerState.time)}
          </div>

          {isCurrentUser && (
            <div className="flex justify-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartStop}
                className={`px-6 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 ${
                  timerState.isRunning
                    ? theme === 'dark'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 shadow-red-500/30'
                      : 'bg-red-100 text-red-600 hover:bg-red-200 shadow-red-500/20'
                    : theme === 'dark'
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 shadow-green-500/30'
                      : 'bg-green-100 text-green-600 hover:bg-green-200 shadow-green-500/20'
                }`}
              >
                {timerState.isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Duraklat
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Başlat
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className={`px-6 py-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 hover:bg-gray-700'
                    : 'bg-gray-200 hover:bg-gray-300'
                } rounded-xl font-semibold transition-all duration-200 flex items-center gap-2`}
              >
                <RotateCcw className="w-5 h-5" />
                Sıfırla
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};