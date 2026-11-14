import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AIAssistantButton } from '../ai/AIAssistantButton';
import { AIAssistantPanel } from '../ai/AIAssistantPanel';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const location = useLocation();

  // If on a queue detail route (/queues/:id), pass queueId to AI copilot context
  const queueIdMatch = location.pathname.match(/^\/queues\/([0-9a-fA-F]{24})$/);
  const currentQueueId = queueIdMatch ? queueIdMatch[1] : null;

  return (
    <div className="min-h-screen bg-[#050606] text-[#F5F3EF] flex relative overflow-x-hidden">
      {/* Full-Screen Ambient Video Background - Original Master Clarity (Watermark Removed, Uncompressed) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-screen h-screen object-cover opacity-90 pointer-events-none z-0"
        src="/background.mp4"
      />

      {/* Sidebar Navigation (Translucent Glassmorphic) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 relative z-10 bg-transparent">
        <main className="flex-1 pb-16">
          <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
        </main>
      </div>

      {/* Floating AI Assistant Copilot */}
      <AIAssistantButton
        isOpen={aiAssistantOpen}
        onClick={() => setAiAssistantOpen((prev) => !prev)}
      />
      <AIAssistantPanel
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        currentQueueId={currentQueueId}
      />
    </div>
  );
};
