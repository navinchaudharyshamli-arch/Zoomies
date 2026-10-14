import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Laptop } from 'lucide-react';

export const TestBanner: React.FC = () => {
  const { isDemo } = useAuth();
  const showBanner = import.meta.env.VITE_TEST_BANNER !== 'false';

  if (!showBanner && !isDemo) return null;

  return (
    <div className="w-full bg-[#3b2923] text-white text-[11px] font-medium py-1.5 px-3 flex items-center justify-between z-50 sticky top-0 shadow-sm">
      <div className="flex items-center gap-1.5 truncate">
        <span className="w-2 h-2 rounded-full bg-[#f28a4b] animate-ping" />
        <span className="truncate">
          {isDemo ? (
            <span className="text-[#fca5a5] font-semibold flex items-center gap-1">
              <Laptop size={12} /> Demo mode: data stays on this device only.
            </span>
          ) : (
            <span className="text-[#fde68a]">
              Test version. No real orders or payments.
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] opacity-80 pl-2 shrink-0">
        <span className="bg-white/10 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">
          {isDemo ? 'Demo' : 'Shared Realtime'}
        </span>
      </div>
    </div>
  );
};
