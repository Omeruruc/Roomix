import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Plus, Lock, LogIn, Settings, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import RoomSettings from './RoomSettings';

interface Room {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
  password_hash: string;
  max_users: number;
  owner_id: string;
}

interface RoomListProps {
  session: Session;
  onRoomSelect: (roomId: string) => void;
}

export default function RoomList({ session, onRoomSelect }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState(10);
  const [joinPassword, setJoinPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      const sortedRooms = [...rooms].sort((a, b) => {
        if ((a.owner_id === session.user.id) === (b.owner_id === session.user.id)) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.owner_id === session.user.id ? -1 : 1;
      });
      setFilteredRooms(sortedRooms);
    } else {
      const query = searchQuery.toLowerCase();
      const filteredAndSorted = rooms
        .filter(
          room => 
            room.id.toLowerCase().includes(query) ||
            room.name.toLowerCase().includes(query)
        )
        .sort((a, b) => {
          if ((a.owner_id === session.user.id) === (b.owner_id === session.user.id)) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return a.owner_id === session.user.id ? -1 : 1;
        });
      setFilteredRooms(filteredAndSorted);
    }
  }, [searchQuery, rooms, session.user.id]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch rooms');
      return;
    }

    const sortedRooms = (data || []).sort((a, b) => {
      if ((a.owner_id === session.user.id) === (b.owner_id === session.user.id)) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.owner_id === session.user.id ? -1 : 1;
    });

    setRooms(sortedRooms);
    setFilteredRooms(sortedRooms);
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoomPassword.trim()) {
      toast.error('Room password is required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase.from('rooms').insert([
        {
          name: newRoomName,
          password_hash: newRoomPassword,
          max_users: maxUsers,
          owner_id: user.id,
          owner_email: user.email
        }
      ]).select().single();

      if (error) throw error;

      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomPassword('');
      setMaxUsers(10);
      onRoomSelect(data.id);
      toast.success('Room created successfully!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (!joinPassword.trim()) {
      toast.error('Room password is required');
      return;
    }

    try {
      // First, verify the password matches
      if (joinPassword !== selectedRoom.password_hash) {
        toast.error('Incorrect password');
        return;
      }

      // Only proceed with joining if password is correct
      const { data: existingMembership, error: membershipError } = await supabase
        .from('room_users')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .eq('user_id', session.user.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      if (existingMembership) {
        setShowJoinModal(false);
        setJoinPassword('');
        onRoomSelect(selectedRoom.id);
        return;
      }

      // Check current number of users
      const { count, error: countError } = await supabase
        .from('room_users')
        .select('*', { count: 'exact' })
        .eq('room_id', selectedRoom.id);

      if (countError) throw countError;

      if (count !== null && count >= selectedRoom.max_users) {
        toast.error('Room is full. Please try another room.');
        setShowJoinModal(false);
        setJoinPassword('');
        return;
      }

      // Join the room
      const { error: joinError } = await supabase
        .from('room_users')
        .insert([
          {
            room_id: selectedRoom.id,
            user_id: session.user.id
          }
        ]);

      if (joinError) throw joinError;

      setShowJoinModal(false);
      setJoinPassword('');
      onRoomSelect(selectedRoom.id);
      toast.success('Successfully joined the room!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Chat Rooms
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Room
          </motion.button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms by name or ID..."
            className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
          />
        </div>

        <div className="grid gap-4">
          {filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-800/50 p-4 rounded-xl border transition-all duration-200 ${
                room.owner_id === session.user.id
                  ? 'border-blue-500/50 hover:border-blue-500'
                  : 'border-gray-700/50 hover:border-blue-500/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                    {room.owner_id === session.user.id && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">Created by {room.owner_email}</p>
                  <p className="text-xs text-gray-500 mt-1">Room ID: {room.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {room.owner_id === session.user.id && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowSettings(true);
                      }}
                      className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowJoinModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Join Room
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Create New Room</h3>
            <form onSubmit={createRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Password
                </label>
                <input
                  type="password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Maximum Users (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200"
                >
                  Create Room
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Join {selectedRoom.name}</h3>
            <form onSubmit={joinRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Password
                </label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setSelectedRoom(null);
                    setJoinPassword('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Join Room
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Room Settings Modal */}
      {showSettings && selectedRoom && (
        <RoomSettings
          room={selectedRoom}
          onClose={() => {
            setShowSettings(false);
            setSelectedRoom(null);
          }}
          onRoomDeleted={() => {
            setShowSettings(false);
            setSelectedRoom(null);
          }}
        />
      )}
    </div>
  );
}