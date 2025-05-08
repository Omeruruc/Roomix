import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { MessageSquare, Users, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import StudyTimer from './StudyTimer';
import Chat from './Chat';
import RoomMembers from './RoomMembers';
import Leaderboard from './Leaderboard';

interface RoomViewProps {
  session: Session;
  roomId: string;
}

interface RoomUser {
  user_id: string;
  user_email: string;
  avatar_url: string | null;
}

export default function RoomView({ session, roomId }: RoomViewProps) {
  const [showChat, setShowChat] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      // Check if user is room owner
      const { data: roomData } = await supabase
        .from('rooms')
        .select('owner_id')
        .eq('id', roomId)
        .single();

      if (roomData) {
        setIsOwner(roomData.owner_id === session.user.id);
      }

      // Fetch room users
      const { data: roomUsersData, error: roomUsersError } = await supabase
        .from('room_users')
        .select('user_id')
        .eq('room_id', roomId);

      if (roomUsersError) {
        console.error('Error fetching room users:', roomUsersError);
        return;
      }

      if (!roomUsersData?.length) {
        setRoomUsers([]);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .rpc('get_user_emails', {
          user_ids: roomUsersData.map(u => u.user_id)
        });

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      // Kullanıcıların profil fotoğraflarını getir
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', roomUsersData.map(u => u.user_id));

      // Sort users so owner is always first
      const users = roomUsersData.map(roomUser => {
        const user = userData?.find((u: { id: string }) => u.id === roomUser.user_id);
        const profile = profilesData?.find(p => p.id === roomUser.user_id);
        
        return {
          user_id: roomUser.user_id,
          user_email: user?.email || 'Unknown User',
          avatar_url: profile?.avatar_url || null
        };
      }).sort((a, b) => {
        if (a.user_id === roomData?.owner_id) return -1;
        if (b.user_id === roomData?.owner_id) return 1;
        return 0;
      });

      setRoomUsers(users);
    };

    fetchRoomDetails();

    const channel = supabase
      .channel(`room_users:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_users',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchRoomDetails();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, session.user.id]);

  const handleKickUser = async (userId: string) => {
    if (!isOwner) return;

    try {
      // Önce study_timers tablosundan kullanıcının kronometresini sil
      const { error: timerError } = await supabase
        .from('study_timers')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (timerError) {
        console.error('Kronometre silinirken hata oluştu:', timerError);
      }

      // Sonra room_users tablosundan kullanıcıyı sil
      const { error: kickError } = await supabase
        .from('room_users')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (kickError) throw kickError;

      toast.success('Kullanıcı odadan çıkarıldı');
      
      // Kullanıcı listesinden manuel olarak kaldır
      setRoomUsers(current => current.filter(user => user.user_id !== userId));
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6 flex flex-wrap justify-end gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMembers(!showMembers)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          Oda Üyeleri
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowLeaderboard(!showLeaderboard);
            setShowChat(false);
          }}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 flex items-center gap-2"
        >
          <Trophy className="w-5 h-5" />
          {showLeaderboard ? 'Kronometreleri Göster' : 'Liderlik Tablosu'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowChat(!showChat);
            setShowLeaderboard(false);
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          {showChat ? 'Kronometreleri Göster' : 'Sohbeti Aç'}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {showMembers && (
          <RoomMembers
            users={roomUsers}
            isOwner={isOwner}
            onKickUser={handleKickUser}
            onClose={() => setShowMembers(false)}
          />
        )}
      </AnimatePresence>

      {showLeaderboard && <Leaderboard roomId={roomId} />}

      <div className={showChat || showLeaderboard ? 'hidden' : ''}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roomUsers.map((user) => (
            <StudyTimer
              key={user.user_id}
              userId={user.user_id}
              userEmail={user.user_email}
              roomId={roomId}
              isCurrentUser={user.user_id === session.user.id}
              avatar_url={user.avatar_url}
            />
          ))}
        </div>
      </div>

      {showChat && <Chat session={session} roomId={roomId} />}
    </div>
  );
}