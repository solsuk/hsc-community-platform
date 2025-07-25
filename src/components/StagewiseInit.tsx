'use client';

import { useEffect } from 'react';
import { initStagewise } from '@/lib/stagewise';

export default function StagewiseInit() {
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initStagewise();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // This component renders nothing
  return null;
} 