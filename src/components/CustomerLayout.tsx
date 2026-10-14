import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TestBanner } from './TestBanner';
import { TabBar } from './TabBar';
import { ContactModal } from './ContactModal';
import { HelpCircle } from 'lucide-react';

export const CustomerLayout: React.FC = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-screen bg-[#e9e4dc] dark:bg-[#1c1918] flex justify-center selection:bg-[#f28a4b] selection:text-white transition-colors duration-200">
      <div className="w-full max-w-[430px] min-h-screen bg-[#fbf6ed] dark:bg-[#1f1b19] text-[#3b2923] dark:text-[#f5ebe3] flex flex-col relative shadow-[0_20px_50px_rgba(51,38,31,0.15)] overflow-x-hidden">
        <TestBanner />

        {/* Global Floating Help / Contact Icon */}
        <button
          type="button"
          onClick={() => setShowContact(true)}
          className="fixed top-11 right-4 sm:right-[calc(50%-200px)] z-30 w-8 h-8 rounded-full bg-white/90 dark:bg-[#292421]/90 backdrop-blur-md border border-[#e9ded2] dark:border-[#443a35] text-[#f28a4b] flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          title="Contact Zoomies Cafe"
        >
          <HelpCircle size={17} />
        </button>

        <main className="flex-1 pb-28 overflow-y-auto">
          <Outlet />
        </main>
        <TabBar />

        <ContactModal
          isOpen={showContact}
          onClose={() => setShowContact(false)}
        />
      </div>
    </div>
  );
};
