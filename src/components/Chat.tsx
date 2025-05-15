import React, { useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Send, Smile, Image as ImageIcon, X, Loader2, Paperclip, User, MessageSquare, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  user_email: string;
  image_url?: string;
  message_type: 'text' | 'image';
  room_id: string;
  avatar_url?: string;
}

interface ChatProps {
  session: Session;
  roomId: string;
}

export default function Chat({ session, roomId }: ChatProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomUsers, setRoomUsers] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Oda bilgilerini getir
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('name')
          .eq('id', roomId)
          .single();
          
        if (error) {
          console.error('Oda bilgileri getirilemedi:', error);
          return;
        }
        
        if (data) {
          setRoomName(data.name);
        }
        
        // Odadaki kullanıcı sayısını al
        const { count } = await supabase
          .from('room_users')
          .select('*', { count: 'exact' })
          .eq('room_id', roomId);
          
        if (count !== null) {
          setRoomUsers(count);
        }
        
      } catch (error) {
        console.error('Oda bilgileri alınamadı:', error);
      }
    };
    
    fetchRoomDetails();
    
    // Oda kullanıcıları değiştiğinde güncellemek için dinleyici
    const roomUsersChannel = supabase
      .channel('room_users_count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_users', filter: `room_id=eq.${roomId}` },
        async () => {
          const { count } = await supabase
            .from('room_users')
            .select('*', { count: 'exact' })
            .eq('room_id', roomId);
            
          if (count !== null) {
            setRoomUsers(count);
          }
        }
      )
      .subscribe();
      
    return () => {
      roomUsersChannel.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Önce tüm mesajları getir
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          toast.error('Failed to fetch messages');
          return;
        }

        if (!messagesData || messagesData.length === 0) {
          setMessages([]);
          return;
        }

        // Mesajları atan her kullanıcının profil bilgilerini getir
        const uniqueUserIds = [...new Set(messagesData.map(msg => msg.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', uniqueUserIds);

        if (profilesError) {
          console.error('Failed to fetch profile data:', profilesError);
        }

        // Mesajlara profil fotoğraflarını ekle
        const messagesWithAvatars = messagesData.map(message => {
          const userProfile = profilesData?.find(profile => profile.id === message.user_id);
          return {
            ...message,
            avatar_url: userProfile?.avatar_url || null
          };
        });

        setMessages(messagesWithAvatars);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages');
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            
            // Yeni mesajın kullanıcısına ait profil bilgisini getir
            const { data: profileData } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', newMessage.user_id)
              .single();
              
            // Avatar bilgisini ekle
            const messageWithAvatar = {
              ...newMessage,
              avatar_url: profileData?.avatar_url || null
            };
            
            setMessages((current) => [...current, messageWithAvatar]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          content: newMessage,
          user_id: session.user.id,
          user_email: session.user.email,
          message_type: 'text',
          room_id: roomId
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(filePath);

      const { error: messageError } = await supabase.from('messages').insert([
        {
          content: 'Sent an image',
          user_id: session.user.id,
          user_email: session.user.email,
          image_url: publicUrl,
          message_type: 'image',
          room_id: roomId
        },
      ]);

      if (messageError) throw messageError;
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div 
        className={`rounded-2xl shadow-lg h-[600px] flex flex-col relative transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-800'
            : 'bg-white'
        } ${
          isDragging ? 'outline outline-2 outline-blue-500' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Sohbet başlığı */}
        <div className={`py-3 px-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                {roomName || 'Çalışma Odası'}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>{roomUsers} kullanıcı</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            theme === 'dark' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-green-100 text-green-600'
          }`}>
            Aktif
          </div>
        </div>
        
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center z-50">
            <div className={`shadow-lg flex flex-col items-center gap-3 p-6 rounded-xl ${
              theme === 'dark' 
                ? 'bg-gray-800' 
                : 'bg-white'
            }`}>
              <Paperclip className="w-8 h-8 text-blue-400" />
              <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>
                Görselinizi buraya bırakın
              </p>
            </div>
          </div>
        )}
        
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.user_id === session.user.id ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.user_id !== session.user.id && (
                  <div className="flex-shrink-0 mr-2">
                    {message.avatar_url ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden shadow-md">
                        <img
                          src={message.avatar_url}
                          alt={message.user_email}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700' 
                          : 'bg-gray-100'
                      }`}>
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-[70%] rounded-2xl p-4 shadow-md ${
                    message.user_id === session.user.id
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className={`text-sm font-medium mb-1 flex flex-wrap items-center justify-between ${
                    theme === 'dark' ? 'opacity-80' : 'opacity-70'
                  }`}>
                    <span className="truncate mr-2">{message.user_email}</span>
                    <span className="text-xs opacity-70 whitespace-nowrap">
                      {new Date(message.created_at).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </p>
                  
                  {message.message_type === 'image' ? (
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={message.image_url} 
                      alt="Paylaşılan görsel" 
                      className="rounded-lg max-w-full h-auto"
                      loading="lazy"
                    />
                  ) : (
                    <p className="break-words">{message.content}</p>
                  )}
                </motion.div>
                
                {message.user_id === session.user.id && (
                  <div className="flex-shrink-0 ml-2">
                    {message.avatar_url ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden shadow-md">
                        <img
                          src={message.avatar_url}
                          alt={message.user_email}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700' 
                          : 'bg-gray-100'
                      }`}>
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
        <div className="relative">
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full right-0 mb-2"
              >
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className={`absolute -top-2 -right-2 p-1 rounded-full z-10 shadow-md ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    } transition-colors`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="shadow-xl rounded-xl overflow-hidden">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme={theme === 'dark' ? 'dark' as any : 'light' as any} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSend} className={`p-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl transition-all duration-200 shadow-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                      : 'bg-white hover:bg-gray-50 text-yellow-500'
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </motion.button>
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                  />
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-xl transition-all duration-200 shadow-md ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-blue-400'
                        : 'bg-white hover:bg-gray-50 text-blue-500'
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </div>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className={`flex-1 px-4 py-2.5 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20'
                } outline-none`}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg flex items-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-blue-500 hover:bg-blue-400'
                } transition-all duration-200`}
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Gönder</span>
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}