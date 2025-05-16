import React, { useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Send, BrainCircuit, X, User, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { fal } from '@fal-ai/client';

// Fal.ai API anahtarını yapılandır
fal.config({
  credentials: "62ff12a0-45e4-4e1d-8923-22cefbd8bbb0:e5fb106f5ff6ff70de5712dd540abf5e"
});

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  is_ai: boolean;
  avatar_url?: string | null;
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
  const [avatar, setAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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
    setMessages([welcomeMessage]);

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
    
    // Kullanıcıya özel AI sohbetlerini getir
    const fetchAIChats = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_chats')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error('AI sohbetleri getirilemedi:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const formattedMessages = data.map(chat => ({
            id: chat.id,
            created_at: chat.created_at,
            content: chat.content,
            user_id: chat.is_ai ? 'ai-coach' : session.user.id,
            is_ai: chat.is_ai,
            avatar_url: null
          }));
          
          setMessages([welcomeMessage, ...formattedMessages]);
        }
      } catch (error) {
        console.error('AI sohbetleri alınamadı:', error);
      }
    };
    
    fetchAIChats();
  }, [session.user.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Kullanıcı mesajını ekle
      const userMessage = {
        id: `user-${Date.now()}`,
        created_at: new Date().toISOString(),
        content: newMessage,
        user_id: session.user.id,
        is_ai: false,
        avatar_url: avatar
      };
      
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsLoading(true);
      
      // Kullanıcı mesajını veritabanına kaydet
      const { error: userMessageError } = await supabase
        .from('ai_chats')
        .insert([
          {
            content: newMessage,
            user_id: session.user.id,
            is_ai: false
          }
        ]);
        
      if (userMessageError) {
        console.error('Kullanıcı mesajı kaydedilemedi:', userMessageError);
      }
      
      // Fal.ai API'sini kullanarak AI yanıtı al
      try {
        const result = await fal.subscribe("fal-ai/any-llm", {
          input: {
            model: "google/gemini-flash-1.5",
            prompt: newMessage,
            system_prompt: "Sen bir eğitim koçusun. Öğrencilere çalışma teknikleri, motivasyon, zaman yönetimi ve akademik başarı konularında yardımcı oluyorsun. Yanıtlarını Türkçe olarak ver ve samimi bir dil kullan."
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log("AI yanıtı hazırlanıyor...");
            }
          },
        });

        const aiResponse = result.data.output;
        
        // AI cevabını oluştur
        const aiMessageResponse = {
          id: `ai-${Date.now()}`,
          created_at: new Date().toISOString(),
          content: aiResponse,
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
              content: aiResponse,
              user_id: session.user.id,
              is_ai: true
            }
          ]);
          
        if (aiMessageError) {
          console.error('AI mesajı kaydedilemedi:', aiMessageError);
        }
      } catch (aiError) {
        console.error('AI yanıtı alınamadı:', aiError);
        toast.error('AI yanıtı alınamadı. Lütfen tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
      
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };
  
  const clearConversation = async () => {
    try {
      // Kullanıcıya özel AI sohbetlerini sil
      const { error } = await supabase
        .from('ai_chats')
        .delete()
        .eq('user_id', session.user.id);
        
      if (error) {
        console.error('Sohbet geçmişi silinemedi:', error);
        toast.error('Sohbet geçmişi silinemedi');
        return;
      }
      
      // Welcome mesajını tekrar göster
      const welcomeMessage = {
        id: `ai-welcome-${Date.now()}`,
        created_at: new Date().toISOString(),
        content: "Konuşma geçmişi temizlendi. Yeni bir konuşmaya başlayabilirsin!",
        user_id: 'ai-coach',
        is_ai: true,
        avatar_url: null
      };
      
      setMessages([welcomeMessage]);
      toast.success('Sohbet geçmişi temizlendi');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

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
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  !message.is_ai ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.is_ai && (
                  <div className="flex-shrink-0 mr-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-violet-500`}>
                      <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
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
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex-shrink-0 mr-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-violet-500`}>
                    <BrainCircuit className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className={`rounded-2xl p-4 shadow-md max-w-[80%] ${
                  theme === 'dark'
                    ? 'bg-violet-600/80 text-white'
                    : 'bg-violet-100 text-gray-900'
                }`}
                >
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
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