import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Save, X, Image, User, Loader, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { theme } = useTheme();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isNameUpdating, setIsNameUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Mevcut kullanıcı bilgilerini al
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setNewEmail(user.email || '');
        
        // Profil fotoğrafını getir
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
          
        if (profileData && !profileError) {
          setAvatarUrl(profileData.avatar_url);
        }
        
        // İsim ve soyisim bilgilerini getir
        const { data: nameData, error: nameError } = await supabase
          .from('users_fullname')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
          
        if (nameData && !nameError) {
          setFirstName(nameData.first_name || '');
          setLastName(nameData.last_name || '');
        }
      }
    };
    
    fetchUserData();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('E-posta güncellemek için mevcut şifreniz gereklidir');
      return;
    }

    if (!validateEmail(newEmail)) {
      toast.error('Lütfen geçerli bir e-posta adresi girin');
      return;
    }

    setIsUpdating(true);
    try {
      // Kullanıcının mevcut e-posta adresini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('Kullanıcı bilgisi alınamadı');
      }
      
      // Önce oturum açarak kimlik doğrulaması yap
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        toast.error('Geçersiz şifre. Lütfen şifrenizi kontrol edin.');
        return;
      }
      
      // E-posta adresini güncelle
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      });
      
      if (error) {
        if (error.message.includes('email_address_invalid')) {
          toast.error('Bu e-posta adresi kullanılamaz. Lütfen farklı bir e-posta deneyin.');
        } else {
          throw error;
        }
        return;
      }
      
      toast.success('E-posta güncelleme isteği gönderildi. Onay için e-postanızı kontrol edin.');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Şifre güncellemek için mevcut şifreniz gereklidir');
      return;
    }

    setIsUpdating(true);
    try {
      // Kullanıcının mevcut e-posta adresini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('Kullanıcı bilgisi alınamadı');
      }
      
      // Önce oturum açarak kimlik doğrulaması yap
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        toast.error('Geçersiz şifre. Lütfen şifrenizi kontrol edin.');
        return;
      }
      
      // Şifreyi güncelle
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      toast.success('Şifre başarıyla güncellendi');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası yükleyin');
      return;
    }
    
    setSelectedFile(file);
    
    // Önizleme için dosyayı URL'e dönüştür
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast.error('Lütfen önce bir fotoğraf seçin');
      return;
    }
    
    setIsAvatarUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      // Dosya uzantısını al
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Önce storage bucket'ın var olduğundan emin ol
      try {
        await supabase.storage.getBucket('profiles');
      } catch (error) {
        // Bucket yoksa oluştur
        await supabase.storage.createBucket('profiles', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
      }
      
      // Dosyayı storage'a yükle
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Yüklenen dosyanın public URL'ini al
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      // Profil tablosunu güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
        
      if (updateError) throw updateError;
      
      // State'i güncelle
      setAvatarUrl(publicUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      toast.success('Profil fotoğrafı başarıyla güncellendi');
      
    } catch (error) {
      console.error('Profil fotoğrafı yükleme hatası:', error);
      if (error instanceof Error) {
        toast.error(`Profil fotoğrafı yüklenirken hata oluştu: ${error.message}`);
      }
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameUpdating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      const { error } = await supabase
        .from('users_fullname')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
      
      toast.success('İsim ve soyisim başarıyla güncellendi');
    } catch (error) {
      console.error('İsim güncelleme hatası:', error);
      if (error instanceof Error) {
        toast.error(`İsim güncellenirken hata oluştu: ${error.message}`);
      }
    } finally {
      setIsNameUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative`}
      >
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-2 rounded-lg ${
            theme === 'dark'
              ? 'hover:bg-gray-700'
              : 'hover:bg-gray-100'
          } transition-colors z-10`}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Profil Ayarları</h2>
        </div>

        <div className="space-y-6">
          {/* Profil Fotoğrafı Bölümü */}
          <div className="flex flex-col items-center space-y-4">
            <div 
              className={`relative w-24 h-24 rounded-full overflow-hidden border-2 ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
              }`}
            >
              {previewUrl ? (
                // Önizleme fotoğrafı
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : avatarUrl ? (
                // Mevcut profil fotoğrafı
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                // Varsayılan avatar
                <div className={`w-full h-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <User className={`w-12 h-12 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </div>
              )}
              
              {isAvatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarUploading}
                className={`px-4 py-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                } rounded-xl transition-colors flex items-center gap-2 ${
                  isAvatarUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Image className="w-5 h-5" />
                {avatarUrl ? 'Fotoğraf Seç' : 'Fotoğraf Seç'}
              </motion.button>
              
              {selectedFile && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAvatarUpload}
                  disabled={isAvatarUploading}
                  className={`px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl transition-colors flex items-center gap-2 ${
                    isAvatarUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isAvatarUploading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Kaydet
                </motion.button>
              )}
            </div>
          </div>

          {/* İsim-Soyisim Güncelleme Formu */}
          <form onSubmit={handleUpdateName} className="space-y-4">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Kişisel Bilgiler</h3>
            <div className="space-y-2">
              <div className="relative">
                <UserCheck className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                  placeholder="Adınız"
                />
              </div>
              <div className="relative">
                <UserCheck className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                  placeholder="Soyadınız"
                />
              </div>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isNameUpdating}
              className={`w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-200 flex items-center justify-center gap-2 ${
                isNameUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isNameUpdating ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Bilgileri Kaydet
            </motion.button>
          </form>

          {/* Email Update Form */}
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>E-posta Güncelle</h3>
            <div className="space-y-2">
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                  placeholder="Yeni e-posta adresi"
                  required
                />
              </div>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                  placeholder="Mevcut şifre"
                  required
                />
              </div>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUpdating}
              className={`w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center justify-center gap-2 ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUpdating ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              E-Posta Güncelle
            </motion.button>
          </form>

          {/* Password Update Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Şifre Güncelle</h3>
            <div className="space-y-2">
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                  placeholder="Mevcut şifre"
                  required
                />
              </div>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200`}
                  placeholder="Yeni şifre"
                  required
                />
              </div>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUpdating}
              className={`w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center justify-center gap-2 ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUpdating ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Şifre Güncelle
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}