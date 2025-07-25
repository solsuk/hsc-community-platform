'use client';

import dynamic from 'next/dynamic';

// Import ChatBot dynamically with no SSR
const ChatBot = dynamic(() => import('./ChatBot'), { ssr: false });

export default function ClientWrapper() {
  return <ChatBot />;
} 