import React, { useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Send, BrainCircuit, X, User, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { geminiService } from '../lib/geminiService';

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  is_ai: boolean;
  avatar_url: string | null;
}

interface AICoachProps {
  session: Session;
  onClose: () => void;
}

export default function AICoach({ session, onClose }: AICoachProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Kullanıcı giriş yaptığında AI koçu karşılama mesajıyla başlat
    const welcomeMessage = {
      id: `ai-welcome-${Date.now()}`,
      created_at: new Date().toISOString(),
      content: "Merhaba! Ben senin AI eğitim koçunum. Çalışmalarında yardımcı olmak için buradayım. Herhangi bir sorun veya yardıma ihtiyacın olduğunda bana sorabilirsin.",
      user_id: 'ai-coach',
      is_ai: true,
      avatar_url: null
    };

    // Önceki mesajları getir
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_chats')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Mesajlar getirilemedi:', error);
          return;
        }

        if (data && data.length > 0) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            created_at: msg.created_at,
            content: msg.content,
            user_id: msg.is_ai ? 'ai-coach' : session.user.id,
            is_ai: msg.is_ai,
            avatar_url: msg.is_ai ? null : avatar
          }));
          setMessages([welcomeMessage, ...formattedMessages]);
        } else {
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Mesajlar alınamadı:', error);
        setMessages([welcomeMessage]);
      }
    };

    fetchMessages();

    // Kullanıcının profil fotoğrafını getir
    const fetchUserAvatar = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error('Avatar getirilemedi:', error);
          return;
        }
        
        if (data) {
          setAvatar(data.avatar_url);
        }
      } catch (error) {
        console.error('Avatar alınamadı:', error);
      }
    };
    
    fetchUserAvatar();
  }, [session.user.id]);

  const clearConversation = async () => {
    try {
      // Veritabanındaki mesajları sil
      const { error } = await supabase
        .from('ai_chats')
        .delete()
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Mesajlar silinemedi:', error);
        toast.error('Mesajlar silinemedi');
        return;
      }

      // Gemini servisindeki geçmişi temizle
      geminiService.clearHistory(session.user.id);

      // Welcome mesajını göster
      const welcomeMessage = {
        id: `ai-welcome-${Date.now()}`,
        created_at: new Date().toISOString(),
        content: "Merhaba! Ben senin AI eğitim koçunum. Çalışmalarında yardımcı olmak için buradayım. Herhangi bir sorun veya yardıma ihtiyacın olduğunda bana sorabilirsin.",
        user_id: 'ai-coach',
        is_ai: true,
        avatar_url: null
      };
      setMessages([welcomeMessage]);
      toast.success('Konuşma geçmişi temizlendi');
    } catch (error) {
      console.error('Konuşma temizlenirken hata:', error);
      toast.error('Konuşma temizlenemedi');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    
    // Kullanıcı mesajını ekle
    const userMessageObj = {
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      content: userMessage,
      user_id: session.user.id,
      is_ai: false,
      avatar_url: avatar
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Kullanıcı mesajını veritabanına kaydet
      const { error: userMessageError } = await supabase
        .from('ai_chats')
        .insert([
          {
            content: userMessage,
            user_id: session.user.id,
            is_ai: false
          }
        ]);
        
      if (userMessageError) {
        console.error('Kullanıcı mesajı kaydedilemedi:', userMessageError);
        throw new Error('Kullanıcı mesajı kaydedilemedi');
      }
      
      // Gemini API'yi kullanarak AI yanıtı al
      const response = await geminiService.generateResponse(
        session.user.id,
        `Sen bir eğitim koçusun. Öğrencilere çalışma teknikleri, motivasyon, zaman yönetimi ve akademik başarı konularında yardımcı oluyorsun. Yanıtlarını Türkçe olarak ver ve samimi bir dil kullan. Kullanıcının sorusu: ${userMessage}`
      );
      
      // Yazıyor animasyonunu kaldır
      setIsTyping(false);
      
      // AI cevabını oluştur
      const aiMessageResponse = {
        id: `ai-${Date.now()}`,
        created_at: new Date().toISOString(),
        content: response,
        user_id: 'ai-coach',
        is_ai: true,
        avatar_url: null
      };
      
      setMessages(prev => [...prev, aiMessageResponse]);
      
      // AI cevabını veritabanına kaydet
      const { error: aiMessageError } = await supabase
        .from('ai_chats')
        .insert([
          {
            content: response,
            user_id: session.user.id,
            is_ai: true
          }
        ]);
        
      if (aiMessageError) {
        console.error('AI mesajı kaydedilemedi:', aiMessageError);
        throw new Error('AI mesajı kaydedilemedi');
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Yazıyor animasyonu bileşeni
  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`flex items-center space-x-2 p-3 rounded-lg ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        theme === 'dark' ? 'bg-violet-600' : 'bg-violet-500'
      }`}>
        <BrainCircuit className="w-4 h-4 text-white" />
      </div>
      <div className="flex space-x-1">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className={`w-2 h-2 rounded-full ${
            theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'
          }`}
        />
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
          className={`w-2 h-2 rounded-full ${
            theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'
          }`}
        />
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
          className={`w-2 h-2 rounded-full ${
            theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'
          }`}
        />
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className={`relative w-full max-w-3xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className={`py-3 px-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-violet-600 text-white' 
                : 'bg-violet-500 text-white'
            }`}>
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Eğitim Koçun
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kişisel AI Asistan</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearConversation}
              className={`p-2 rounded-full text-gray-400 hover:text-gray-600 ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Konuşmayı Temizle"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full text-gray-400 hover:text-gray-600 ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div 
          ref={chatContainerRef}
          className={`h-[calc(80vh-130px)] overflow-y-auto p-4 space-y-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}
        >
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${
                message.is_ai ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.is_ai && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-violet-500 text-white'
                }`}>
                  <BrainCircuit className="w-4 h-4" />
                </div>
              )}
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                  !message.is_ai
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-violet-600/80 text-white'
                      : 'bg-violet-100 text-gray-900'
                }`}
              >
                <p className={`text-sm font-medium mb-1 flex flex-wrap items-center justify-between ${
                  theme === 'dark' ? 'opacity-80' : 'opacity-70'
                }`}>
                  <span className="truncate mr-2">
                    {message.is_ai ? 'Eğitim Koçu' : 'Sen'}
                  </span>
                  <span className="text-xs opacity-70 whitespace-nowrap">
                    {new Date(message.created_at).toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </p>
                
                <p className="break-words whitespace-pre-line">{message.content}</p>
              </motion.div>
              
              {!message.is_ai && (
                <div className="flex-shrink-0 ml-2">
                  {avatar ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden shadow-md">
                      <img
                        src={avatar}
                        alt="Kullanıcı"
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
          
          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSend} className={`p-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Eğitim koçuna bir şey sor..."
              className={`flex-1 px-4 py-2.5 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500/20'
                  : 'bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-violet-500/20'
              } outline-none`}
              disabled={isLoading}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className={`px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg flex items-center gap-2 ${
                isLoading
                  ? theme === 'dark'
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gray-400 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'bg-violet-600 hover:bg-violet-500'
                    : 'bg-violet-500 hover:bg-violet-400'
              } transition-all duration-200`}
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Gönder</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 