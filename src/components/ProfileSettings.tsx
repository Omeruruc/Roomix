import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const validateEmail = (email: string) => {
    // More strict email validation that matches Supabase's requirements
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required to update email');
      return;
    }

    if (!validateEmail(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        if (error.message.includes('email_address_invalid')) {
          toast.error('This email address cannot be used. Please try a different one.');
        } else {
          throw error;
        }
        return;
      }
      toast.success('Email update request sent. Please check your new email for confirmation.');
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
      toast.error('Current password is required to update password');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Email Update Form */}
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <h3 className="text-lg font-semibold">Update Email</h3>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  placeholder="New email address"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  placeholder="Current password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Update Email
            </button>
          </form>

          {/* Password Update Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <h3 className="text-lg font-semibold">Update Password</h3>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  placeholder="Current password"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  placeholder="New password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Update Password
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}