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
  first_name: string | null;
  last_name: string | null;
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
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
      toast.error('Lütfen bir resim dosyası yükleyin');
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
          content: publicUrl,
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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className={`rounded-xl shadow-lg overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Chat Header */}
      <div className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {roomName}
          </h2>
          <div className="flex items-center gap-2">
            <Users className={`w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {roomUsers} kullanıcı
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="h-[400px] overflow-y-auto p-4 space-y-4 scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.95,
                transition: {
                  duration: 0.15,
                  ease: "easeOut"
                }
              }}
              className={`flex items-start gap-3 ${
                message.user_id === session.user.id ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {message.avatar_url ? (
                  <img
                    src={message.avatar_url}
                    alt={message.user_email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {message.first_name?.[0] || message.last_name?.[0] || message.user_email[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className={`max-w-[70%] ${
                message.user_id === session.user.id ? 'text-right' : ''
              }`}>
                <div className={`text-xs mb-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.first_name && message.last_name
                    ? `${message.first_name} ${message.last_name}`
                    : message.user_email}
                </div>
                <div className={`rounded-lg px-4 py-2 ${
                  message.user_id === session.user.id
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.message_type === 'image' ? (
                    <img 
                      src={message.image_url} 
                      alt="Gönderilen resim" 
                      className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => message.image_url && setSelectedImage(message.image_url)}
                    />
                  ) : (
                    message.content
                  )}
                </div>
                <div className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className={`w-full px-4 py-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
              accept="image/*"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-1.5 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-300'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <Smile className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1.5 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-300'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
              </motion.button>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>

      {/* Resim Modalı */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage || ''}
                alt="Büyük resim"
                className="max-w-full max-h-[90vh] rounded-lg object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className={`absolute top-4 right-4 p-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}