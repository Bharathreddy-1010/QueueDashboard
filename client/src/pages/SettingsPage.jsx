import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { useSocket } from '../context/SocketContext';
import {
  Settings,
  Bell,
  Volume2,
  Clock,
  Server,
  Shield,
  CheckCircle2,
  Save,
  Laptop,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { openSidebar } = useOutletContext() || {};
  const { isConnected } = useSocket();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastAlerts, setToastAlerts] = useState(true);
  const [waitAlertThreshold, setWaitAlertThreshold] = useState('15');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [autoServePrompt, setAutoServePrompt] = useState(false);
  const [healthStatus, setHealthStatus] = useState('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data.status === 'healthy' ? 'Healthy' : 'Degraded'))
      .catch(() => setHealthStatus('Offline'));
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem(
      'queuepro_settings',
      JSON.stringify({
        soundEnabled,
        toastAlerts,
        waitAlertThreshold,
        timeFormat,
        autoServePrompt,
      })
    );
    toast.success('Settings saved successfully');
  };

  return (
    <div>
      <Header
        title="Settings & System Configuration"
        subtitle="Manage station defaults, notification preferences, and system diagnostics"
        onMenuClick={openSidebar}
        rightAction={
          <Button
            variant="accent"
            size="sm"
            icon={Save}
            onClick={handleSaveSettings}
            className="glow-accent-sm"
          >
            Save Settings
          </Button>
        }
      />

      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Operational Diagnostics Card */}
        <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#C8FF00] border border-[#272D2D]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F3EF]">System Status & Architecture</h3>
              <p className="text-xs text-[#8E9393]">Live backend connection diagnostics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-[#0D0F0F] border border-[#222727]">
              <span className="text-xs text-[#8E9393] block">Backend API</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#C8FF00]" />
                <span className="font-mono text-sm font-bold text-[#F5F3EF]">{healthStatus}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0F0F] border border-[#222727]">
              <span className="text-xs text-[#8E9393] block">WebSocket Engine</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-[#C8FF00] animate-pulse-subtle' : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono text-sm font-bold text-[#F5F3EF]">
                  {isConnected ? 'Connected (Socket.IO)' : 'Reconnecting...'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0F0F] border border-[#222727]">
              <span className="text-xs text-[#8E9393] block">Database Engine</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#C8FF00]" />
                <span className="font-mono text-sm font-bold text-[#F5F3EF]">MongoDB + Mongoose</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-2xl p-6 border border-[#DDD8CE] shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#050606] text-[#C8FF00]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#050606]">Notification Preferences</h3>
              <p className="text-xs text-[#626868]">Configure desktop and audio alerts during busy hours</p>
            </div>
          </div>

          <div className="divide-y divide-[#E2DDD5] space-y-4 pt-2">
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-[#050606]">Sound Alerts</h4>
                <p className="text-xs text-[#626868]">Chime when a new customer is added or called</p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#050606] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-[#050606]">Toast Alerts</h4>
                <p className="text-xs text-[#626868]">Display real-time notification popups in the UI</p>
              </div>
              <input
                type="checkbox"
                checked={toastAlerts}
                onChange={(e) => setToastAlerts(e.target.checked)}
                className="w-5 h-5 accent-[#050606] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-[#050606]">High Wait Time Alert</h4>
                <p className="text-xs text-[#626868]">Alert manager if any customer waits longer than</p>
              </div>
              <select
                value={waitAlertThreshold}
                onChange={(e) => setWaitAlertThreshold(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#DDD8CE] bg-white text-xs font-semibold text-[#050606] outline-none"
              >
                <option value="10">10 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="20">20 Minutes</option>
                <option value="30">30 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-2xl p-6 border border-[#DDD8CE] shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#050606] text-[#C8FF00]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#050606]">Display & Station Settings</h3>
              <p className="text-xs text-[#626868]">Customize table appearance and time formats</p>
            </div>
          </div>

          <div className="divide-y divide-[#E2DDD5] space-y-4 pt-2">
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-[#050606]">Time Display Format</h4>
                <p className="text-xs text-[#626868]">Display times in 12-hour AM/PM or 24-hour military format</p>
              </div>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#DDD8CE] bg-white text-xs font-semibold text-[#050606] outline-none"
              >
                <option value="12h">12-Hour (e.g. 02:45 PM)</option>
                <option value="24h">24-Hour (e.g. 14:45)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-[#050606]">Auto-Prompt Next Customer</h4>
                <p className="text-xs text-[#626868]">Automatically suggest serving next customer when completing a ticket</p>
              </div>
              <input
                type="checkbox"
                checked={autoServePrompt}
                onChange={(e) => setAutoServePrompt(e.target.checked)}
                className="w-5 h-5 accent-[#050606] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
