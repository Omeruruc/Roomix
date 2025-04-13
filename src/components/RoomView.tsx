import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import StudyTimer from './StudyTimer';
import Chat from './Chat';

interface RoomViewProps {
  session: Session;
  roomId: string;
}

interface RoomUser {
  user_id: string;
  user_email: string;
}

export default function RoomView({ session, roomId }: RoomViewProps) {
  const [showChat, setShowChat] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);

  useEffect(() => {
    const fetchRoomUsers = async () => {
      // First get all room users
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

      // Use the secure function to get user emails
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_emails', {
          user_ids: roomUsersData.map(u => u.user_id)
        });

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      const users = roomUsersData.map(roomUser => {
        const user = userData?.find(u => u.id === roomUser.user_id);
        return {
          user_id: roomUser.user_id,
          user_email: user?.email || 'Unknown User'
        };
      });

      setRoomUsers(users);
    };

    fetchRoomUsers();

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
          fetchRoomUsers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowChat(!showChat)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          {showChat ? 'Show Timers' : 'Open Chat'}
        </motion.button>
      </div>

      {showChat ? (
        <Chat session={session} roomId={roomId} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roomUsers.map((user) => (
            <StudyTimer
              key={user.user_id}
              userId={user.user_id}
              userEmail={user.user_email}
              roomId={roomId}
              isCurrentUser={user.user_id === session.user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}