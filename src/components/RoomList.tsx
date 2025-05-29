import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Plus, Lock, LogIn, Settings, Search, BookOpen, Video, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import RoomSettings from './RoomSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface Room {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
  password_hash: string;
  max_users: number;
  owner_id: string;
  room_type: 'study' | 'watch';
  video_url?: string;
  has_unread_messages: boolean;
}

interface RoomListProps {
  session: Session;
  onRoomSelect: (roomId: string) => void;
}

export default function RoomList({ session, onRoomSelect }: RoomListProps) {
  const { theme } = useTheme();
  const { setCurrentRoomId } = useAuth();
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
  const [roomType, setRoomType] = useState<'study' | 'watch'>('study');
  const [videoUrl, setVideoUrl] = useState('');
  const [createRoomMode, setCreateRoomMode] = useState<boolean>(false);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isLoadingPro, setIsLoadingPro] = useState(false);

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

  useEffect(() => {
    checkProStatus();
  }, [session]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch rooms');
      return;
    }

    // Okunmamış mesajları kontrol et
    const roomsWithUnreadStatus = await Promise.all((data || []).map(async (room) => {
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: lastRead } = await supabase
        .from('room_read_status')
        .select('last_read_at')
        .eq('room_id', room.id)
        .eq('user_id', session.user.id)
        .single();

      return {
        ...room,
        has_unread_messages: lastMessage && lastRead && new Date(lastMessage.created_at) > new Date(lastRead.last_read_at)
      };
    }));

    const sortedRooms = roomsWithUnreadStatus.sort((a, b) => {
      if ((a.owner_id === session.user.id) === (b.owner_id === session.user.id)) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.owner_id === session.user.id ? -1 : 1;
    });

    setRooms(sortedRooms);
    setFilteredRooms(sortedRooms);
  };

  const checkProStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('is_pro')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      setIsPro(data?.is_pro || false);
    } catch (error) {
      console.error('Pro durumu kontrol edilirken hata:', error);
    }
  };

  const handleProUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) {
      toast.error('Lütfen bir promosyon kodu girin');
      return;
    }

    setIsLoadingPro(true);
    try {
      if (promoCode !== 'WORK100') {
        toast.error('Geçersiz promosyon kodu');
        return;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: session.user.id,
          is_pro: true,
          promo_code: promoCode,
          activated_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsPro(true);
      setShowProModal(false);
      setPromoCode('');
      toast.success('Pro versiyona başarıyla yükseltildiniz!');
    } catch (error) {
      console.error('Pro yükseltme hatası:', error);
      toast.error('Pro yükseltme işlemi başarısız oldu');
    } finally {
      setIsLoadingPro(false);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoomPassword.trim()) {
      toast.error('Room password is required');
      return;
    }

    // Watch odası için video URL kontrolü
    if (roomType === 'watch') {
      if (!videoUrl.trim()) {
        toast.error('Video URL is required for Watch rooms');
        return;
      }
      
      // URL'nin geçerli bir video platformundan olup olmadığını kontrol et
      const validateVideoUrl = (url: string): boolean => {
        if (!url) return false;
        
        // Yaygın video platformlarının URL kalıplarını kontrol et
        const patterns = [
          // Popüler platformlar
          /youtube\.com\/watch\?v=/,        // YouTube
          /youtu\.be\//,                    // YouTube kısa
          /vimeo\.com\//,                   // Vimeo
          /facebook\.com\/.*\/videos\//,    // Facebook
          /fb\.watch\//,                    // Facebook kısa
          /twitch\.tv\//,                   // Twitch
          /dailymotion\.com\/video\//,      // Dailymotion
          /streamable\.com\//,              // Streamable
          
          // Film izleme siteleri için genel kalıplar
          /\/embed\//,                      // Embed videoları
          /\/player\//,                     // Player URL'leri
          /\/watch\//,                      // İzleme sayfaları
          /\.mp4/,                          // MP4 dosyaları
          /\.m3u8/,                         // HLS stream'ler
          /\/video\//,                      // Video path'i içerenler
          /player\?/,                       // Player querystring'i olanlar
          /\?vid=/,                         // Video ID'si olanlar
          /\/play\//,                       // Play path'i içerenler
          /stream/                          // Stream kelimesi içerenler
        ];
        
        // Kalıplardan herhangi birine uyuyor mu?
        const matchesPattern = patterns.some(pattern => pattern.test(url));
        
        // Kalıplara uymasa bile, bir HTTP veya HTTPS URL'si mi?
        const isValidUrl = /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url);
        
        // Ya kalıplara uyuyor, ya da geçerli bir URL ise kabul et
        return matchesPattern || isValidUrl;
      };
      
      if (!validateVideoUrl(videoUrl)) {
        toast.error('Please enter a valid video URL from supported platforms (YouTube, Vimeo, etc.)');
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const roomData: any = {
        name: newRoomName,
        password_hash: newRoomPassword,
        max_users: maxUsers,
        owner_id: user.id,
        owner_email: user.email,
        room_type: roomType
      };

      if (roomType === 'watch') {
        roomData.video_url = videoUrl;
      }

      const { data, error } = await supabase.from('rooms').insert([roomData]).select().single();

      if (error) throw error;

      setShowCreateModal(false);
      setCreateRoomMode(false);
      setNewRoomName('');
      setNewRoomPassword('');
      setMaxUsers(10);
      setVideoUrl('');
      setRoomType('study');
      setCurrentRoomId(data.id);
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
      if (joinPassword !== selectedRoom.password_hash) {
        toast.error('Incorrect password');
        return;
      }

      const { data: existingMembership, error: membershipError } = await supabase
        .from('room_users')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (existingMembership) {
        setShowJoinModal(false);
        setJoinPassword('');
        setCurrentRoomId(selectedRoom.id);
        onRoomSelect(selectedRoom.id);
        return;
      }

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

      const { error: joinError } = await supabase
        .from('room_users')
        .insert([
          {
            room_id: selectedRoom.id,
            user_id: session.user.id
          }
        ]);

      if (joinError) throw joinError;

      // Kullanıcının istatistiklerini güncelle
      await supabase.rpc('increment_user_rooms_joined', {
        user_id_param: session.user.id
      });

      setShowJoinModal(false);
      setJoinPassword('');
      setCurrentRoomId(selectedRoom.id);
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
      <div className={`${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50' 
          : 'bg-white/80'
        } backdrop-blur-lg rounded-2xl shadow-2xl p-6`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
          <h2 className={`text-3xl font-bold ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text'
              : 'text-blue-600'
          }`}>
            Chat Rooms
          </h2>
          {isPro && (
            <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white text-sm">
              <Crown className="w-3.5 h-3.5" />
              PRO
            </span>
          )}
          </div>
          <div className="flex items-center gap-3">
            {!isPro && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProModal(true)}
                className={`px-3 py-1.5 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30 hover:shadow-yellow-500/50'
                    : 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30 hover:shadow-yellow-500/50'
                } rounded-xl text-white text-sm font-semibold shadow-lg transition-all duration-200 flex items-center gap-1.5`}
              >
                <Sparkles className="w-4 h-4" />
                Pro'ya Yükselt
              </motion.button>
            )}
          {!createRoomMode ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateRoomMode(true)}
              className={`px-3.5 py-2 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/30 hover:shadow-blue-500/50'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 hover:shadow-blue-600/50'
              } rounded-xl text-white text-sm font-semibold shadow-lg transition-all duration-200 flex items-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              Create Room
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <div className="flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setRoomType('study');
                    setShowCreateModal(true);
                  }}
                  className={`px-2.5 py-1 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/30 hover:shadow-blue-500/50'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 hover:shadow-blue-600/50'
                  } rounded-xl text-white text-xs font-semibold shadow-lg transition-all duration-200 flex items-center gap-1`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Study Room
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setRoomType('watch');
                    setShowCreateModal(true);
                  }}
                  className={`px-2.5 py-1 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/30 hover:shadow-orange-500/50'
                      : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 hover:shadow-orange-500/50'
                  } rounded-xl text-white text-xs font-semibold shadow-lg transition-all duration-200 flex items-center gap-1`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Watch Room
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCreateRoomMode(false)}
                className={`px-3 py-1.5 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } rounded-xl text-sm transition-colors`}
              >
                Cancel
              </motion.button>
            </div>
          )}
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          } w-5 h-5`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms by name or ID..."
            className={`w-full pl-12 pr-4 py-3 ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600 placeholder-gray-400'
                : 'bg-gray-100 border-gray-200 placeholder-gray-500'
            } rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
          />
        </div>

        <div className="grid gap-4">
          {filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                theme === 'dark'
                  ? 'bg-gray-800/50 hover:bg-gray-800/70'
                  : 'bg-white hover:bg-gray-50'
              } p-4 rounded-xl transition-all duration-200 ${
                room.owner_id === session.user.id
                  ? theme === 'dark' 
                    ? 'border-l-4 border-blue-500'
                    : 'border-l-4 border-blue-400'
                  : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>{room.name}</h3>
                    {room.owner_id === session.user.id && (
                      <span className={`px-2 py-1 ${
                        theme === 'dark'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-blue-100 text-blue-600'
                      } text-xs rounded-full`}>
                        Owner
                      </span>
                    )}
                    {room.has_unread_messages && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Yeni Mesaj
                      </span>
                    )}
                    <span className={`px-2 py-1 ${
                      room.room_type === 'study'
                        ? theme === 'dark'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-100 text-green-600'
                        : theme === 'dark'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-orange-100 text-orange-600'
                    } text-xs rounded-full flex items-center gap-1`}>
                      {room.room_type === 'study' ? (
                        <>
                          <BookOpen className="w-3 h-3" />
                          Study
                        </>
                      ) : (
                        <>
                          <Video className="w-3 h-3" />
                          Watch
                        </>
                      )}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Created by {room.owner_email}</p>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  } mt-1`}>Room ID: {room.id}</p>
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
                      className={`p-2 ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 hover:bg-gray-700'
                          : 'bg-gray-100 hover:bg-gray-200'
                      } rounded-lg transition-colors`}
                    >
                      <Settings className="w-5 h-5 text-blue-400" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowJoinModal(true);
                    }}
                    className={`px-4 py-2 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/30 hover:shadow-blue-500/50'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 hover:shadow-blue-600/50'
                    } rounded-xl text-white font-semibold shadow-lg transition-all duration-200 flex items-center gap-2`}
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="hidden sm:inline">Join</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl p-6 max-w-md w-full`}
          >
            <h2 className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Create New {roomType === 'study' ? 'Study' : 'Watch'} Room</h2>
            <form onSubmit={createRoom} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className={`w-full px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                  placeholder="Enter room name"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Room Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="password"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-2 ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                    } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Maximum Users
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                  className={`w-full px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                />
              </div>
              
              {roomType === 'watch' && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Video URL
                  </label>
                  <div className="relative">
                    <Video className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className={`w-full pl-12 pr-4 py-2 ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                      } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                  </div>
                  <p className={`mt-1 text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Use a video URL from platforms like YouTube, Vimeo, or any other supported platform.
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-white"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl p-6 max-w-md w-full`}
          >
            <h2 className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Join Room: {selectedRoom.name}</h2>
            <form onSubmit={joinRoom} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Room Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-2 ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
                    } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                    placeholder="Enter room password"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200"
                >
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
            fetchRooms();
          }}
        />
      )}

      {/* Pro Upgrade Modal */}
      {showProModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl p-6 max-w-md w-full`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className={`w-6 h-6 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
              }`} />
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Pro'ya Yükselt</h2>
            </div>
            <form onSubmit={handleProUpgrade} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Promosyon Kodu
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className={`w-full px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-200'
                  } rounded-xl border focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all duration-200`}
                  placeholder="Promosyon kodunuzu girin"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowProModal(false)}
                  className={`px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  } rounded-xl transition-colors`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoadingPro}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-semibold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingPro ? 'Yükleniyor...' : 'Yükselt'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}