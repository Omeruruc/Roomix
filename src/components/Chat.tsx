import React, { useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Send, Smile, Image as ImageIcon, X, Loader2, Paperclip } from 'lucide-react';
import { toast } from 'react-hot-toast';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  user_email: string;
  image_url?: string;
  message_type: 'text' | 'image';
  room_id: string;
}

interface ChatProps {
  session: Session;
  roomId: string;
}

export default function Chat({ session, roomId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to fetch messages');
        return;
      }

      setMessages(data || []);
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
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((current) => [...current, payload.new as Message]);
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
        className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border ${
          isDragging ? 'border-blue-500 border-2' : 'border-gray-700/50'
        } h-[600px] flex flex-col relative transition-all duration-300`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-gray-800 p-4 rounded-lg shadow-xl flex items-center gap-2">
              <Paperclip className="w-6 h-6 text-blue-400" />
              <p className="text-white font-medium">Drop your image here</p>
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
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-[70%] rounded-2xl p-4 ${
                    message.user_id === session.user.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-gray-800/80 text-gray-100'
                  }`}
                >
                  <p className="text-sm font-medium mb-1 opacity-80">{message.user_email}</p>
                  {message.message_type === 'image' ? (
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={message.image_url} 
                      alt="Shared image" 
                      className="rounded-lg max-w-full h-auto"
                      loading="lazy"
                    />
                  ) : (
                    <p className="break-words">{message.content}</p>
                  )}
                </motion.div>
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
                    className="absolute -top-2 -right-2 p-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSend} className="p-4 border-t border-gray-700/50">
            <div className="flex gap-2">
              <motion.button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
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
                  className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-800 rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}