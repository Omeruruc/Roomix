import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

interface StudyTimerProps {
  userId: string;
  userEmail: string;
  roomId: string;
  isCurrentUser?: boolean;
}

interface TimerState {
  isRunning: boolean;
  time: number;
  subject: string;
}

export default function StudyTimer({ userId, userEmail, roomId, isCurrentUser = false }: StudyTimerProps) {
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

  useEffect(() => {
    const loadTimerState = async () => {
      const { data, error } = await supabase
        .from('study_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load timer state:', error);
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
      }
    };

    loadTimerState();

    // Subscribe to real-time changes for timer updates
    const timerChannel = supabase
      .channel(`study_timers:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_timers',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.new && payload.new.user_id === userId) {
            const newData = payload.new;
            setTimerState({
              isRunning: newData.is_running,
              time: newData.elapsed_time,
              subject: newData.subject || ''
            });
            localTimeRef.current = newData.elapsed_time;
            lastUpdateRef.current = Date.now();
          }
        }
      )
      .subscribe();

    // Subscribe to room_users changes to handle user removal
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
      timerChannel.unsubscribe();
      roomUsersChannel.unsubscribe();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [userId, roomId]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (timerState.isRunning) {
      timerRef.current = setInterval(() => {
        localTimeRef.current += 1;
        setTimerState(prev => ({
          ...prev,
          time: localTimeRef.current
        }));

        // Update server every 5 seconds if this is the current user's timer
        if (isCurrentUser && Date.now() - lastUpdateRef.current >= 5000) {
          const updateServerState = async () => {
            const { error } = await supabase
              .from('study_timers')
              .upsert({
                user_id: userId,
                room_id: roomId,
                elapsed_time: localTimeRef.current,
                is_running: true,
                subject: timerState.subject || subject
              });

            if (error) {
              console.error('Failed to update server state:', error);
            } else {
              lastUpdateRef.current = Date.now();
            }
          };

          updateServerState();
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState.isRunning, userId, roomId, isCurrentUser, timerState.subject, subject]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartStop = async () => {
    if (!isCurrentUser) return;

    if (!timerState.isRunning && !subject.trim() && !timerState.subject) {
      toast.error('Please enter a subject before starting the timer');
      return;
    }

    const newIsRunning = !timerState.isRunning;
    
    const { error } = await supabase
      .from('study_timers')
      .upsert({
        user_id: userId,
        room_id: roomId,
        elapsed_time: localTimeRef.current,
        is_running: newIsRunning,
        subject: subject || timerState.subject,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to update timer state');
      return;
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: newIsRunning,
      subject: subject || prev.subject
    }));
    lastUpdateRef.current = Date.now();
  };

  const handleReset = async () => {
    if (!isCurrentUser) return;

    const { error } = await supabase
      .from('study_timers')
      .upsert({
        user_id: userId,
        room_id: roomId,
        elapsed_time: 0,
        is_running: false,
        subject: subject || timerState.subject,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to reset timer');
      return;
    }

    localTimeRef.current = 0;
    setTimerState(prev => ({
      ...prev,
      time: 0,
      isRunning: false
    }));
    lastUpdateRef.current = Date.now();
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
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{userEmail}'s Study Timer</h3>
        </div>

        <div className="space-y-4">
          {isCurrentUser ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={subject || timerState.subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
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
                Studying: {timerState.subject}
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
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start
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
                Reset
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}