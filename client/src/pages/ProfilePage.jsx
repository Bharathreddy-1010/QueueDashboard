import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { User, Mail, Lock, Shield, CheckCircle, KeyRound, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { openSidebar } = useOutletContext() || {};
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsProfileSubmitting(true);
    try {
      const res = await authApi.updateProfile({ name: name.trim(), email: email.trim() });
      if (res.success) {
        updateUserProfile(res.data.user);
        toast.success('Profile details updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      const res = await authApi.updateProfile({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <div>
      <Header
        title="Manager Profile & Security"
        subtitle="Manage personal details and authentication credentials"
        onMenuClick={openSidebar}
      />

      <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Manager Header Card */}
        <div className="bg-[#131616] border border-[#272D2D] rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#C8FF00] text-[#050606] font-extrabold text-3xl flex items-center justify-center shadow-accent flex-shrink-0">
            {user?.name ? user.name[0].toUpperCase() : 'M'}
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h2 className="text-2xl font-bold text-[#F5F3EF] truncate">{user?.name}</h2>
              <span className="self-center sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30 uppercase">
                {user?.role || 'Manager'}
              </span>
            </div>
            <p className="text-sm text-[#8E9393] mt-1">{user?.email}</p>
            <p className="text-xs text-[#656B6B] mt-2">
              QueuePro Manager with authorization for active queue management and dispatch.
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-3xl p-6 sm:p-8 border border-[#DDD8CE] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#050606] text-[#C8FF00]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#050606]">Personal Details</h3>
              <p className="text-xs text-[#626868]">Update your name and primary email address</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Manager Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              required
              variant="light"
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
              variant="light"
            />

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="accent"
                isLoading={isProfileSubmitting}
                className="glow-accent-sm"
              >
                Save Details
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-3xl p-6 sm:p-8 border border-[#DDD8CE] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#050606] text-[#C8FF00]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#050606]">Change Password</h3>
              <p className="text-xs text-[#626868]">Ensure your account uses a strong, secure passphrase</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              icon={Lock}
              variant="light"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={Lock}
                variant="light"
                helperText="Minimum 6 characters"
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={Lock}
                variant="light"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="dark"
                isLoading={isPasswordSubmitting}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
