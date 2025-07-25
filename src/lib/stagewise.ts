'use client';

import { initToolbar } from '@stagewise/toolbar';

let isInitialized = false;

export function initStagewise() {
  // Only initialize once and only in development mode
  if (isInitialized || process.env.NODE_ENV !== 'development') {
    return;
  }

  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    initToolbar({
      plugins: [],
    });
    isInitialized = true;
    console.log('Stagewise toolbar initialized');
  } catch (error) {
    console.error('Failed to initialize Stagewise toolbar:', error);
  }
} 