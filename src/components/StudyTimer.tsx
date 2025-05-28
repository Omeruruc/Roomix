import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface StudyTimerProps {
  userId: string;
  userEmail: string;
  roomId: string;
  isCurrentUser?: boolean;
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface TimerState {
  isRunning: boolean;
  time: number;
  subject: string;
}

export default function StudyTimer({ userId, userEmail, roomId, isCurrentUser = false, avatar_url, first_name, last_name }: StudyTimerProps) {
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
  const lastSyncTimeRef = useRef<number>(0);
  const navigate = useNavigate();
  
  // Server'a timer durumunu güncelleyen fonksiyon
  const updateServerTimer = async (elapsedTime: number, isRunning: boolean, forceUpdate: boolean = false) => {
    const now = Date.now();
    // Son güncelleme üzerinden 1 saniye geçmemişse ve zorunlu güncelleme değilse, güncelleme yapma
    if (!forceUpdate && now - lastUpdateRef.current < 1000) {
      return;
    }

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
        lastUpdateRef.current = now;
        lastSyncTimeRef.current = elapsedTime;
      }
    } catch (error) {
      console.error('Timer güncellenirken hata oluştu:', error);
    }
  };

  // İnterval'i başlatan yardımcı fonksiyon
  const startInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastSync = Math.floor((now - lastUpdateRef.current) / 1000);
      const newTime = lastSyncTimeRef.current + timeSinceLastSync;
      
      localTimeRef.current = newTime;
      setTimerState(prev => ({
        ...prev,
        time: newTime
      }));
      
      // Her 5 saniyede bir server ile senkronize et
      if (isCurrentUser && timeSinceLastSync >= 5) {
        updateServerTimer(newTime, true, true);
      }
      // Her dolan dakikada total_study_minutes'i artır
      if (isCurrentUser && newTime > 0 && newTime % 60 === 0) {
        await supabase.rpc('update_study_minutes', {
          user_id_param: userId,
          minutes_param: 1
        });
      }
    }, 1000);
  };

  useEffect(() => {
    // Timer verilerini yükle
    const loadTimerState = async () => {
      try {
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
          const now = Date.now();
          const lastUpdate = new Date(data.updated_at).getTime();
          let elapsedTime = data.elapsed_time;

          // Eğer timer çalışıyorsa, son güncelleme ile şu an arasındaki süreyi ekle
          if (data.is_running) {
            const timeDiff = Math.floor((now - lastUpdate) / 1000);
            elapsedTime += timeDiff;
          }

          setTimerState({
            isRunning: data.is_running,
            time: elapsedTime,
            subject: data.subject || ''
          });
          localTimeRef.current = elapsedTime;
          lastSyncTimeRef.current = elapsedTime;
          lastUpdateRef.current = now;
          setSubject(data.subject || '');
          
          // Timer çalışıyorsa interval'i başlat
          if (data.is_running) {
            startInterval();
          }
        }
      } catch (err) {
        console.error('Timer yüklenirken hata:', err);
      }
    };

    // İlk yükleme
    loadTimerState();
    
    // Timer değişikliklerini dinle
    const timerChannel = supabase
      .channel(`room_timer:${roomId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_timers',
          filter: `room_id=eq.${roomId} AND user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setIsVisible(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return;
          }
          
          if (payload.new) {
            const newData = payload.new as { 
              is_running: boolean; 
              elapsed_time: number; 
              subject?: string;
              updated_at: string;
            };
            
            const now = Date.now();
            const lastUpdate = new Date(newData.updated_at).getTime();
            let elapsedTime = Number(newData.elapsed_time) || 0;

            // Eğer timer çalışıyorsa, son güncelleme ile şu an arasındaki süreyi ekle
            if (Boolean(newData.is_running)) {
              const timeDiff = Math.floor((now - lastUpdate) / 1000);
              elapsedTime += timeDiff;
            }
            
            setTimerState({
              isRunning: Boolean(newData.is_running),
              time: elapsedTime,
              subject: String(newData.subject || '')
            });
            
            localTimeRef.current = elapsedTime;
            lastSyncTimeRef.current = elapsedTime;
            lastUpdateRef.current = now;
            
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
    
    // Kullanıcı odadan çıkarıldığında kronometreyi gizle
    const userChannel = supabase
      .channel(`room_user:${roomId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_users',
          filter: `room_id=eq.${roomId} AND user_id=eq.${userId}`
        },
        () => {
          console.log('Kullanıcı odadan çıkarıldı:', userId);
          setIsVisible(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      timerChannel.unsubscribe();
      userChannel.unsubscribe();
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

  // Kullanıcı için gösterilecek adı oluşturan yardımcı fonksiyon
  const getUserDisplayName = () => {
    // İsim ve soyisim varsa tam adı göster
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    // Sadece isim varsa
    if (first_name) {
      return first_name;
    }
    // Sadece soyisim varsa
    if (last_name) {
      return last_name;
    }
    // Hiçbiri yoksa e-posta adresini göster
    return userEmail;
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
            ? 'bg-gray-800/30 border-gray-700/50'
            : 'bg-white/50 border-gray-200'
        } p-6 rounded-xl border backdrop-blur-sm`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Clock className={`w-6 h-6 ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`} />
          
          {/* Kullanıcı avatarı */}
          {avatar_url ? (
            <div 
              className="w-8 h-8 rounded-full overflow-hidden border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                console.log('Profil sayfasına yönlendiriliyor:', userEmail);
                navigate(`/user/${encodeURIComponent(userEmail)}`);
              }}
            >
              <img
                src={avatar_url}
                alt={getUserDisplayName()}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              } border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => {
                console.log('Profil sayfasına yönlendiriliyor:', userEmail);
                navigate(`/user/${encodeURIComponent(userEmail)}`);
              }}
            >
              <User className="w-4 h-4 text-gray-400" />
            </div>
          )}
          
          <div className="flex flex-col">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>{getUserDisplayName()}</h3>
            
            {/* İsim ve e-posta farklıysa, e-postayı küçük yazıyla göster */}
            {(first_name || last_name) && (
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{userEmail}</span>
            )}
          </div>
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
                    ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
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