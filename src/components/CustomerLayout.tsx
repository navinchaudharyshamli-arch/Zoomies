import React from 'react';
import { Outlet } from 'react-router-dom';
import { TestBanner } from './TestBanner';
import { TabBar } from './TabBar';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#e9e4dc] dark:bg-[#1c1918] flex justify-center selection:bg-[#f28a4b] selection:text-white transition-colors duration-200">
      <div className="w-full max-w-[430px] min-h-screen bg-[#fbf6ed] dark:bg-[#1f1b19] text-[#3b2923] dark:text-[#f5ebe3] flex flex-col relative shadow-[0_20px_50px_rgba(51,38,31,0.15)] overflow-x-hidden">
        <TestBanner />
        <main className="flex-1 pb-28 overflow-y-auto">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  );
};
