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
  joined_at: string;
  fullname: string | null;
  avatar_url: string | null;
}

export default function RoomView({ session, roomId }: RoomViewProps) {
  const [showChat, setShowChat] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchRoomUsers = async () => {
      // Odaya katılan kullanıcıları al
      const { data: roomUsersData, error: roomUsersError } = await supabase
        .from('room_users')
        .select('user_id, joined_at')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (roomUsersError) {
        toast.error('Kullanıcı bilgileri alınamadı');
        console.error('Error fetching room users:', roomUsersError);
        return;
      }

      // Kullanıcı ID'leri topla
      const userIds = roomUsersData.map(ru => ru.user_id);

      // Kullanıcı e-posta bilgilerini al
      const { data: userEmails, error: emailError } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });

      if (emailError) {
        toast.error('Kullanıcı email bilgileri alınamadı');
        console.error('Error fetching user emails:', emailError);
        return;
      }

      // Kullanıcı profil bilgilerini al
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, fullname, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
      }

      // Tüm kullanıcı verilerini birleştir
      const users = roomUsersData.map((roomUser) => {
        const email = userEmails.find((ue: { id: string, email: string }) => ue.id === roomUser.user_id)?.email || '';
        const profile = profilesData?.find(p => p.id === roomUser.user_id);
        
        return {
          user_id: roomUser.user_id,
          user_email: email,
          joined_at: roomUser.joined_at,
          fullname: profile?.fullname || null,
          avatar_url: profile?.avatar_url || null
        };
      });

      setRoomUsers(users);
      
      // Oda sahibi kontrolü yap
      setIsOwner(users[0]?.user_id === session.user.id);
    };

    fetchRoomUsers();

    // Realtime kullanıcı değişikliklerini izle
    const channel = supabase
      .channel(`room_users:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_users',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchRoomUsers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, session.user.id]);

  const handleKickUser = async (userId: string) => {
    if (!isOwner) return;

    try {
      const { error: kickError } = await supabase
        .from('room_users')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (kickError) throw kickError;

      toast.success('User removed from room');
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
          Room Members
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
          {showLeaderboard ? 'Show Timers' : 'Leader board'}
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
          {showChat ? 'Show Timers' : 'Open Chat'}
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
          {roomUsers
            .sort((a, b) => {
              // Kullanıcının kendisi ilk sırada olsun
              if (a.user_id === session.user.id) return -1;
              if (b.user_id === session.user.id) return 1;
              // Diğer kullanıcılar katılma sırasına göre sıralansın
              return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
            })
            .map((user) => (
              <StudyTimer
                key={user.user_id}
                userId={user.user_id}
                userEmail={user.user_email}
                roomId={roomId}
                isCurrentUser={user.user_id === session.user.id}
                fullname={user.fullname}
                avatar_url={user.avatar_url}
              />
            ))}
        </div>
      </div>

      {showChat && <Chat session={session} roomId={roomId} />}
    </div>
  );
}