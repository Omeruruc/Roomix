import React, { useState } from 'react';
import { Settings, Lock, Users, Trash2, AlertCircle, Video, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface Room {
  id: string;
  name: string;
  password_hash: string;
  max_users: number;
  owner_id: string;
  room_type: 'study' | 'watch';
  video_url?: string;
}

interface RoomSettingsProps {
  room: Room;
  onClose: () => void;
  onRoomDeleted: () => void;
}

export default function RoomSettings({ room, onClose, onRoomDeleted }: RoomSettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState(room.max_users);
  const [videoUrl, setVideoUrl] = useState(room.video_url || '');
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVideoHelp, setShowVideoHelp] = useState(false);

  const validateVideoUrl = (url: string): boolean => {
    if (!url) return true; // Boş URL geçerli (video olmayan odalar için)
    
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

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    
    if (url && !validateVideoUrl(url)) {
      setVideoUrlError('Bu URL desteklenmiyor. Lütfen YouTube, Vimeo gibi desteklenen bir platform URL\'si girin.');
    } else {
      setVideoUrlError(null);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (room.room_type === 'watch' && videoUrl && !validateVideoUrl(videoUrl)) {
      toast.error('Lütfen desteklenen bir video URL\'si girin.');
      return;
    }
    
    setIsUpdating(true);

    try {
      const updates: Partial<Room> = {
        max_users: maxUsers,
      };

      if (newPassword) {
        updates.password_hash = newPassword;
      }
      
      if (room.room_type === 'watch') {
        updates.video_url = videoUrl;
      }

      const { error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', room.id);

      if (error) throw error;

      toast.success('Room settings updated successfully');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      // Delete in correct order to handle foreign key constraints
      // 1. Delete messages
      await supabase
        .from('messages')
        .delete()
        .eq('room_id', room.id);

      // 2. Delete room_users
      await supabase
        .from('room_users')
        .delete()
        .eq('room_id', room.id);

      // 3. Finally delete the room
      await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);

      toast.success('Room deleted successfully');
      onRoomDeleted();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold">Room Settings</h2>
        </div>

        <form onSubmit={handleUpdateSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Password (leave blank to keep current)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                placeholder="New room password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Maximum Users
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                min="1"
                max="100"
                value={maxUsers}
                onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                className="w-full pl-12 pr-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
              />
            </div>
          </div>
          
          {room.room_type === 'watch' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-300">Video URL</label>
                <button 
                  type="button" 
                  onClick={() => setShowVideoHelp(!showVideoHelp)}
                  className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <Info className="w-3.5 h-3.5" />
                  Desteklenen Platformlar
                </button>
              </div>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={handleVideoUrlChange}
                  className={`w-full pl-12 pr-4 py-2 bg-gray-700 rounded-xl border ${
                    videoUrlError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none transition-all duration-200`}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              {videoUrlError && (
                <p className="mt-1 text-xs text-red-400">{videoUrlError}</p>
              )}
              
              {showVideoHelp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Desteklenen Video Platformları:</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                    <div>• YouTube</div>
                    <div>• Vimeo</div>
                    <div>• Facebook</div>
                    <div>• Twitch</div>
                    <div>• SoundCloud</div>
                    <div>• Streamable</div>
                    <div>• Wistia</div>
                    <div>• DailyMotion</div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Video URL'si direkt olarak video sayfasından kopyalanmalıdır. 
                    Örnek: https://www.youtube.com/watch?v=abcdefg
                  </p>
                </motion.div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors flex items-center gap-2"
              disabled={isUpdating || isDeleting}
            >
              <Trash2 className="w-5 h-5" />
              Delete Room
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
              disabled={isUpdating || isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || isDeleting || (room.room_type === 'watch' && Boolean(videoUrl) && Boolean(videoUrlError))}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-2 mb-6 text-red-400">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">Delete Room</h3>
              </div>

              <form onSubmit={handleDeleteRoom} className="space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to delete this room? This action cannot be undone.
                  Type "DELETE" to confirm.
                </p>
                <input
                  type="text"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-200"
                  placeholder='Type "DELETE" to confirm'
                  required
                  pattern="DELETE"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || deletePassword !== 'DELETE'}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition-colors flex items-center gap-2"
                  >
                    {isDeleting ? (
                      'Deleting...'
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Delete Room
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}