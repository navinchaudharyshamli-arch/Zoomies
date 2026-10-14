import React, { useState } from 'react';
import { CAFE_INFO } from '../config/menuData';
import { Phone, MessageCircle, MapPin, X, HelpCircle, Clock } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  title = 'Contact Zoomies Cafe',
  subtitle = 'We are here to assist with pet diets, allergies & orders',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-[#fffdf9] dark:bg-[#292421] rounded-t-3xl p-5 space-y-4 shadow-2xl relative">
        <div className="w-10 h-1 bg-[#e9ded2] dark:bg-[#443a35] rounded-full mx-auto" />

        <div className="flex items-center justify-between pb-1 border-b border-[#e9ded2] dark:border-[#443a35]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#fff0e5] dark:bg-[#3d2c24] text-[#f28a4b] flex items-center justify-center font-bold">
              🐾
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#3b2923] dark:text-[#f5ebe3] leading-tight">
                {title}
              </h2>
              <span className="text-[10px] text-[#9b8b84]">{subtitle}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3eadc] dark:bg-[#3d2c24] flex items-center justify-center text-[#6f5c54] dark:text-[#c1b2a9]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cafe Address & Direct Call */}
        <div className="p-3.5 rounded-2xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-[#f28a4b] shrink-0 mt-0.5" />
            <div>
              <b className="text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] block">
                {CAFE_INFO.name}
              </b>
              <p className="text-[11px] text-[#6f5c54] dark:text-[#c1b2a9] leading-relaxed">
                {CAFE_INFO.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-[#9b8b84]">
            <Clock size={12} className="text-[#f28a4b]" />
            <span>Open Daily: 9:00 AM – 9:00 PM</span>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <a
            href={`tel:${CAFE_INFO.phone_raw}`}
            className="h-12 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <Phone size={14} />
            <span>Call Team</span>
          </a>

          <a
            href={`https://wa.me/${CAFE_INFO.whatsapp}?text=Hi%20Zoomies%20Cafe%2C%20I%20have%20a%20question%20about%20pet%20meals%20and%20orders!`}
            target="_blank"
            rel="noreferrer"
            className="h-12 rounded-2xl bg-[#34775d] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <MessageCircle size={15} />
            <span>WhatsApp Us</span>
          </a>
        </div>

        <p className="text-center text-[10px] text-[#9b8b84] pt-1">
          Direct helpline: <span className="font-bold text-[#3b2923] dark:text-[#f5ebe3]">{CAFE_INFO.phone}</span>
        </p>
      </div>
    </div>
  );
};
