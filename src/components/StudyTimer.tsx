import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    time: 0,
    subject: ''
  });
  const [subject, setSubject] = useState('');

  useEffect(() => {
    // Load existing timer state from Supabase
    const loadTimerState = async () => {
      const { data, error } = await supabase
        .from('study_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) {
        toast.error('Failed to load timer state');
        return;
      }

      if (data) {
        setTimerState({
          isRunning: data.is_running,
          time: data.elapsed_time,
          subject: data.subject || ''
        });
        setSubject(data.subject || '');
      }
    };

    loadTimerState();

    // Subscribe to timer updates
    const channel = supabase
      .channel(`timer:${roomId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_timers',
          filter: `user_id=eq.${userId} AND room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.new) {
            setTimerState({
              isRunning: payload.new.is_running,
              time: payload.new.elapsed_time,
              subject: payload.new.subject || ''
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, roomId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && isCurrentUser) {
      interval = setInterval(async () => {
        setTimerState(prev => ({
          ...prev,
          time: prev.time + 1
        }));

        // Update timer state in Supabase every 5 seconds
        if ((timerState.time + 1) % 5 === 0) {
          const { error } = await supabase
            .from('study_timers')
            .upsert({
              user_id: userId,
              room_id: roomId,
              elapsed_time: timerState.time + 1,
              is_running: true,
              subject: timerState.subject
            });

          if (error) {
            toast.error('Failed to update timer state');
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, userId, roomId, isCurrentUser]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartStop = async () => {
    if (!isCurrentUser) return;

    if (!timerState.isRunning && !subject.trim()) {
      toast.error('Please enter a subject before starting the timer');
      return;
    }

    const newIsRunning = !timerState.isRunning;
    
    const { error } = await supabase
      .from('study_timers')
      .upsert({
        user_id: userId,
        room_id: roomId,
        elapsed_time: timerState.time,
        is_running: newIsRunning,
        subject: subject || timerState.subject
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
        subject: subject || timerState.subject
      });

    if (error) {
      toast.error('Failed to reset timer');
      return;
    }

    setTimerState(prev => ({
      ...prev,
      time: 0,
      isRunning: false
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-blue-400" />
        <h3 className="text-lg font-semibold">{userEmail}'s Study Timer</h3>
      </div>

      <div className="space-y-4">
        {isCurrentUser ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={subject || timerState.subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="flex-1 px-4 py-2 bg-gray-700/50 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
              disabled={timerState.isRunning}
            />
          </div>
        ) : (
          timerState.subject && (
            <p className="text-center text-gray-400">
              Studying: {timerState.subject}
            </p>
          )
        )}

        <div className="text-4xl font-bold text-center font-mono">
          {formatTime(timerState.time)}
        </div>

        {isCurrentUser && (
          <div className="flex justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartStop}
              className={`px-6 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2
                ${timerState.isRunning
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 shadow-red-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 shadow-green-500/30'
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
              className="px-6 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}