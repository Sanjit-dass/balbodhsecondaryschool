import React from 'react';

export default function WhatsAppFab({ phoneEnvName = 'VITE_WHATSAPP_NUMBER', messageEnvName = 'VITE_WHATSAPP_MESSAGE' }) {
  // Read number and default message from Vite env (set at build/deploy time)
  const number = (import.meta.env && import.meta.env[phoneEnvName]) || import.meta.env?.VITE_WHATSAPP_NUMBER || '';
  const rawMsg = (import.meta.env && import.meta.env[messageEnvName]) || import.meta.env?.VITE_WHATSAPP_MESSAGE || 'Hello%20from%20BalBodh%20School';

  const targetUrl = number
    ? `https://wa.me/${number.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(rawMsg)}`
    : 'https://www.whatsapp.com/';

  const openChat = (e) => {
    e.preventDefault();
    window.open(targetUrl, '_blank', 'noopener');
  };

  return (
    <div className="fixed z-50 right-4 bottom-6 md:right-8 md:bottom-8">
      <button
        onClick={openChat}
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg flex items-center justify-center text-white text-2xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
          <path d="M20.52 3.48A11.9 11.9 0 0012.04.5C6.21.5 1.5 5.2 1.5 11.04c0 1.94.5 3.75 1.45 5.36L.5 23.5l7.4-2.04A11.86 11.86 0 0012.04 23.5c5.83 0 10.54-4.7 10.54-10.54 0-2.83-1.08-5.48-3.06-7.48zM12.04 21.5c-1.6 0-3.15-.4-4.5-1.15l-.33-.19-4.38 1.2 1.2-4.27-.2-.34A8.86 8.86 0 013.17 11.04c0-4.93 4.01-8.94 8.87-8.94 4.86 0 8.87 4.01 8.87 8.94 0 4.93-4.01 8.94-8.87 8.94z" />
          <path d="M17.3 14.2c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.18.2-.36.22-.66.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.74-1.65-2.04-.17-.3-.02-.46.12-.61.12-.12.28-.32.42-.48.14-.16.19-.27.28-.45.09-.18.04-.33-.02-.48-.06-.15-.68-1.64-.93-2.26-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.52.07-.8.36-.28.29-1.07 1.04-1.07 2.53 0 1.49 1.1 2.94 1.25 3.15.15.22 2.14 3.45 5.18 4.84 3.04 1.4 3.04.93 3.59.87.55-.06 1.77-.72 2.02-1.41.25-.69.25-1.28.18-1.41-.07-.12-.28-.19-.58-.34z" />
        </svg>
      </button>
    </div>
  );
}
