import React, { useEffect, useState } from 'react';
import { Trophy, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface LeaderboardProps {
  roomId: string;
}

interface LeaderboardUser {
  user_id: string;
  user_email: string;
  elapsed_time: number;
  subject: string;
  rank?: number;
}

export default function Leaderboard({ roomId }: LeaderboardProps) {
  const { theme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);

      // Kronometreleri getir
      const { data: timerData, error: timerError } = await supabase
        .from('study_timers')
        .select('user_id, elapsed_time, subject')
        .eq('room_id', roomId)
        .order('elapsed_time', { ascending: false });

      if (timerError) throw timerError;

      if (!timerData || timerData.length === 0) {
        setLeaderboardData([]);
        return;
      }

      // Kullanıcı e-posta adreslerini al
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_emails', {
          user_ids: timerData.map(item => item.user_id)
        });

      if (userError) throw userError;

      // Verileri birleştir
      const combinedData = timerData.map((timer, index) => {
        const user = userData?.find((u: { id: string; email: string }) => u.id === timer.user_id);
        return {
          user_id: timer.user_id,
          user_email: user?.email || 'Bilinmeyen Kullanıcı',
          elapsed_time: timer.elapsed_time,
          subject: timer.subject || '',
          rank: index + 1
        };
      });

      setLeaderboardData(combinedData);
    } catch (error) {
      console.error('Liderlik tablosu verisi alınırken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();

    // Gerçek zamanlı güncellemeler için abone ol
    const channel = supabase
      .channel(`study_timers_leaderboard:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_timers',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchLeaderboardData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <div className={`${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50' 
        : 'bg-white/80 border-gray-200'
    } backdrop-blur-lg rounded-2xl shadow-2xl border p-6 mb-6`}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className={`w-6 h-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
        <h2 className="text-xl font-bold">Liderlik Tablosu</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Henüz timer verisi yok
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="grid grid-cols-12 font-medium mb-2 px-4 py-2 text-sm text-gray-500">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Kullanıcı</div>
            <div className="col-span-3">Konu</div>
            <div className="col-span-3">Süre</div>
          </div>

          <div className="space-y-2">
            {leaderboardData.map((user) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl ${
                  theme === 'dark' 
                    ? 'bg-gray-800/50 hover:bg-gray-700/50' 
                    : 'bg-gray-100/50 hover:bg-gray-200/50'
                } transition-colors`}
              >
                <div className={`col-span-1 font-bold text-lg ${getRankColor(user.rank || 0)}`}>
                  {user.rank}
                </div>
                <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{user.user_email}</span>
                </div>
                <div className="col-span-3 truncate">{user.subject || '-'}</div>
                <div className="col-span-3 flex items-center gap-1">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{formatTime(user.elapsed_time)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 