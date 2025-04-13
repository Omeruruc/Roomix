import React, { useState } from 'react';
import { Settings, Lock, Users, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface Room {
  id: string;
  name: string;
  password_hash: string;
  max_users: number;
  owner_id: string;
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const updates: Partial<Room> = {
        max_users: maxUsers,
      };

      if (newPassword) {
        updates.password_hash = newPassword;
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
              disabled={isUpdating || isDeleting}
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