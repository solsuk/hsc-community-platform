'use client';

import { useState, useEffect } from 'react';
import AuthStatus from './AuthStatus';

interface LiquidGlassHeaderProps {
  onPostTypeSelect: (type: 'sell' | 'trade' | 'announce' | 'wanted') => void;
  onFormOpen: () => void;
}

export default function LiquidGlassHeader({ onPostTypeSelect, onFormOpen }: LiquidGlassHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Handle scroll behavior for logo shrinking
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Setup chat functionality
  useEffect(() => {
    const setupCompactChatbot = () => {
      const chatToggleBtn = document.getElementById('main-chat-toggle-btn');
      const chatPanel = document.getElementById('main-chat-panel');
      const chatCloseBtn = document.getElementById('main-chat-close-btn');
      const chatInput = document.getElementById('main-chat-input') as HTMLInputElement;
      const chatSendBtn = document.getElementById('main-chat-send-btn');
      const chatMessages = document.getElementById('main-chat-messages');

      if (!chatToggleBtn || !chatPanel || !chatCloseBtn || !chatInput || !chatSendBtn || !chatMessages) {
        return;
      }

      // Periodic jingle animation
      const startPeriodicJingle = () => {
        setInterval(() => {
          if (chatPanel.classList.contains('opacity-0')) {
            if (chatToggleBtn && chatToggleBtn.classList) {
              chatToggleBtn.classList.add('animate-chat-jingle');
              setTimeout(() => {
                if (chatToggleBtn && chatToggleBtn.classList) {
                  chatToggleBtn.classList.remove('animate-chat-jingle');
                }
              }, 600);
            }
          }
        }, 5000);
      };

      startPeriodicJingle();

      const toggleChat = () => {
        const isVisible = !chatPanel.classList.contains('opacity-0');
        if (isVisible) {
          chatPanel.classList.add('opacity-0', 'invisible', 'translate-y-2');
        } else {
          chatPanel.classList.remove('opacity-0', 'invisible', 'translate-y-2');
          chatInput.focus();
        }
      };

      const addUserMessage = (message: string) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'glass-announce rounded-lg p-3 border-2 border-black/20 ml-8';
        userDiv.innerHTML = `<div class="text-black text-sm font-semibold text-right">You: ${message}</div>`;
        chatMessages.appendChild(userDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };

      const addBotMessage = (message: string, listings?: any[]) => {
        const botDiv = document.createElement('div');
        botDiv.className = 'glass rounded-lg p-3 border-2 border-black/20 mr-8';
        
        let content = `<div class="text-black text-sm font-semibold">🏘️ ${message}</div>`;
        
        if (listings && listings.length > 0) {
          content += '<div class="mt-2 space-y-1">';
          listings.slice(0, 3).forEach(listing => {
            content += `<div class="text-xs text-black/80 bg-white/20 rounded p-1">📋 ${listing.title} (${listing.type})</div>`;
          });
          if (listings.length > 3) {
            content += `<div class="text-xs text-black/60">...and ${listings.length - 3} more</div>`;
          }
          content += '</div>';
        }
        
        botDiv.innerHTML = content;
        chatMessages.appendChild(botDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };

      const getBotResponse = async (query: string) => {
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          
          if (!response.ok) throw new Error('Failed to get response');
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('Chat error:', error);
          return {
            response: "I'm having trouble connecting right now. Please try again later!",
            listings: []
          };
        }
      };

      const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        addUserMessage(message);
        chatInput.value = '';
        
        const { response, listings } = await getBotResponse(message);
        addBotMessage(response, listings);
      };

      // Event listeners
      chatToggleBtn.addEventListener('click', toggleChat);
      chatCloseBtn.addEventListener('click', toggleChat);
      chatSendBtn.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    };

    const timer = setTimeout(setupCompactChatbot, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle menu item selection
  const handleMenuItemClick = (type: 'sell' | 'trade' | 'announce' | 'wanted') => {
    setIsMenuOpen(false);
    onPostTypeSelect(type);
    onFormOpen();
  };

  return (
    <>
      {/* Floating Logo - Overlaps header and content like NYBG */}
      <div className={`fixed left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${
        isScrolled ? 'top-4 scale-75' : 'top-12 scale-100'
      }`}>
        <div className="text-center">
          <h1 className={`font-black tracking-tight transition-all duration-500 text-center ${
            isScrolled ? 'text-4xl' : 'text-9xl'
          } text-black drop-shadow-lg`}>
            HSC
          </h1>
          <p className={`font-bold text-black/70 transition-all duration-500 text-center ${
            isScrolled ? 'text-xs' : 'text-lg'
          } drop-shadow-sm`}>
            HILLSMERE SHORES CLASSIFIEDS
          </p>
        </div>
      </div>

      {/* HSC Header with Fixed Size */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out bg-white py-3 ${
        isScrolled ? 'shadow-lg backdrop-blur-xl' : ''
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu - Top Left */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="px-6 py-4 rounded-lg font-black text-lg transition-all duration-300 border-2 border-black glass-sell text-white shadow-lg hover:scale-105 flex items-center space-x-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <span>MENU</span>
              </button>
              
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute top-12 left-0 glass-dark rounded-lg shadow-xl border-2 border-black min-w-48 z-50">
                  <div className="p-2 space-y-1">
                                  <button
                onClick={() => handleMenuItemClick('sell')}
                className="w-full text-left px-4 py-2 text-black font-bold hover:glass-sell rounded transition-all duration-200"
              >
                FOR SALE
              </button>
                    <button 
                      onClick={() => handleMenuItemClick('trade')}
                      className="w-full text-left px-4 py-2 text-black font-bold hover:glass-trade rounded transition-all duration-200"
                    >
                      TRADE
                    </button>
                    <button 
                      onClick={() => handleMenuItemClick('announce')}
                      className="w-full text-left px-4 py-2 text-black font-bold hover:glass-announce rounded transition-all duration-200"
                    >
                      ANNOUNCE
                    </button>
                    <button 
                      onClick={() => handleMenuItemClick('wanted')}
                                              className="w-full text-left px-4 py-2 text-black font-bold hover:glass-wanted rounded transition-all duration-200"
                    >
                      WANTED
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spacer for logo positioning */}
            <div className="flex-1"></div>

            {/* Right Side Navigation - Fixed Position */}
            <div className="flex items-center space-x-2">
              {/* Chat Button - Category Style with Rainbow Effects */}
              <button 
                id="main-chat-toggle-btn"
                className="px-6 py-4 rounded-lg font-black text-lg transition-all duration-300 border-2 border-black glass-trade text-white shadow-lg hover:scale-105 rainbow-chat-button animate-rainbow-shift animate-attention-pulse"
                title="Open HSC Assistant"
                style={{
                  animationDelay: '0s, 2s',
                  transformOrigin: 'center center'
                }}
                onMouseEnter={(e) => {
                  if (e.currentTarget && e.currentTarget.classList) {
                    e.currentTarget.classList.add('animate-chat-jingle');
                    e.currentTarget.classList.remove('animate-rainbow-shift');
                    e.currentTarget.classList.add('animate-rainbow-shift-hover');
                    
                    setTimeout(() => {
                      if (e.currentTarget && e.currentTarget.classList) {
                        e.currentTarget.classList.remove('animate-chat-jingle');
                      }
                    }, 600);
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget && e.currentTarget.classList) {
                    e.currentTarget.classList.remove('animate-rainbow-shift-hover');
                    e.currentTarget.classList.add('animate-rainbow-shift');
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                CHAT
              </button>

              {/* AuthStatus Integration */}
              <AuthStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
              
      {/* Chat Panel - HSC Style */}
      <div 
        id="main-chat-panel" 
        className="fixed top-20 right-6 w-80 glass-dark rounded-lg shadow-xl opacity-0 invisible transform translate-y-2 transition-all duration-300 z-50 border-2 border-black"
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-black/20 bg-black text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-sm">HSC ASSISTANT</h3>
            <button 
              id="main-chat-close-btn"
              className="text-white/80 hover:text-white transition-colors font-bold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Chat Messages Area */}
        <div id="main-chat-messages" className="h-64 overflow-y-auto p-4 space-y-3 bg-white">
          <div className="glass rounded-lg p-3 border-2 border-black/20">
            <div className="text-black text-sm font-semibold">
              🏘️ Welcome to HSC Assistant! Ask about classifieds, community listings, or neighborhood services!
            </div>
          </div>
        </div>
        
        {/* Chat Input Area */}
        <div className="p-4 border-t border-black/20 bg-white rounded-b-lg">
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Ask about Hillsmere Shores..." 
              className="flex-1 px-3 py-2 glass rounded-lg text-black placeholder-black/60 border-2 border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 text-sm font-medium"
              id="main-chat-input"
            />
            <button 
              id="main-chat-send-btn"
              className="glass-announce px-4 py-2 rounded-lg text-white hover:glass-morph transition-all duration-200 border-2 border-black bg-black font-bold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polyline points="22,2 15,22 11,13 2,9 22,2"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 