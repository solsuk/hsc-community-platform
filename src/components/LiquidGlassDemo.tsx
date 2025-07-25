'use client';

import { useState, useEffect } from 'react';
import ChatBot from './ChatBot';

export default function LiquidGlassDemo() {
  const [selectedType, setSelectedType] = useState<'sell' | 'trade' | 'announce' | 'wanted'>('sell');

  // Setup new compact chatbot functionality
  useEffect(() => {
    const setupCompactChatbot = () => {
      const toggleBtn = document.getElementById('chat-toggle-btn') as HTMLButtonElement;
      const closeBtn = document.getElementById('chat-close-btn') as HTMLButtonElement;
      const chatPanel = document.getElementById('chat-panel') as HTMLElement;
      const chatInput = document.getElementById('chat-input') as HTMLInputElement;
      const sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;
      const messagesContainer = document.getElementById('chat-messages') as HTMLElement;
      
      if (!toggleBtn || !closeBtn || !chatPanel || !chatInput || !sendBtn || !messagesContainer) return;

      // Periodic jingle animation to grab attention
      const startPeriodicJingle = () => {
        const jingleInterval = setInterval(() => {
          // Only jingle if chat is closed
          if (chatPanel.classList.contains('opacity-0')) {
            toggleBtn.classList.add('animate-chat-jingle');
            setTimeout(() => {
              toggleBtn.classList.remove('animate-chat-jingle');
            }, 600);
          }
        }, 5000); // Jingle every 5 seconds
        
        return jingleInterval;
      };

      const jingleInterval = startPeriodicJingle();

      // Toggle chat panel
      const toggleChat = () => {
        const isVisible = chatPanel.classList.contains('opacity-100');
        if (isVisible) {
          chatPanel.classList.remove('opacity-100', 'visible', 'translate-y-0');
          chatPanel.classList.add('opacity-0', 'invisible', 'translate-y-2');
        } else {
          chatPanel.classList.remove('opacity-0', 'invisible', 'translate-y-2');
          chatPanel.classList.add('opacity-100', 'visible', 'translate-y-0');
          chatInput.focus();
        }
      };

      // Add user message to chat
      const addUserMessage = (message: string) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-end';
        messageDiv.innerHTML = `
          <div class="glass-announce rounded-lg p-3 max-w-xs">
            <div class="text-white text-sm">${message}</div>
          </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      };

      // Add bot message to chat
      const addBotMessage = (message: string, listings?: any[]) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-start';
        
        let content = `
          <div class="glass rounded-lg p-3 max-w-xs">
            <div class="text-white text-sm">${message}</div>
        `;
        
        // Add listings if provided (but limit to 2-3 for compact display)
        if (listings && listings.length > 0) {
          content += '<div class="mt-2 space-y-1">';
          listings.slice(0, 2).forEach((listing: any) => {
            content += `
              <div class="glass-sell rounded p-2">
                <div class="text-white text-xs font-medium">${listing.title}</div>
                <div class="text-white/80 text-xs">${listing.description.substring(0, 60)}...</div>
              </div>
            `;
          });
          if (listings.length > 2) {
            content += `<div class="text-white/60 text-xs">...and ${listings.length - 2} more</div>`;
          }
          content += '</div>';
        }
        
        content += '</div>';
        messageDiv.innerHTML = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      };

      // Get bot response
      const getBotResponse = async (query: string) => {
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query }),
          });
          
          if (!response.ok) throw new Error('Failed to get response');
          return await response.json();
        } catch (error) {
          console.error('Error getting bot response:', error);
          return {
            type: 'error',
            message: "I'm having trouble right now. Please try again!"
          };
        }
      };

      // Handle sending message
      const sendMessage = async () => {
        const query = chatInput.value.trim();
        if (!query) return;

        // Add user message
        addUserMessage(query);
        chatInput.value = '';

        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex justify-start typing-indicator';
        typingDiv.innerHTML = `
          <div class="glass rounded-lg p-3">
            <div class="text-white text-sm">Typing...</div>
          </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Get bot response
        const response = await getBotResponse(query);
        
        // Remove typing indicator
        typingDiv.remove();
        
        // Add bot response
        addBotMessage(response.message, response.listings);
      };

      // Event listeners
      toggleBtn.addEventListener('click', toggleChat);
      closeBtn.addEventListener('click', toggleChat);
      sendBtn.addEventListener('click', sendMessage);
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });

      // Cleanup
      return () => {
        clearInterval(jingleInterval);
        toggleBtn.removeEventListener('click', toggleChat);
        closeBtn.removeEventListener('click', toggleChat);
        sendBtn.removeEventListener('click', sendMessage);
        chatInput.removeEventListener('keydown', sendMessage);
      };
    };

    // Setup with a small delay to ensure DOM is ready
    const timer = setTimeout(setupCompactChatbot, 100);
    return () => clearTimeout(timer);
  }, []);

  const demoCards = [
    {
      type: 'sell' as const,
      title: 'Kayak for Sale',
      description: 'Lightly used kayak, perfect for Duvall Creek adventures',
      price: '$450',
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
    {
      type: 'trade' as const,
      title: 'Garden Tools for Patio Furniture',
      description: 'Have extra garden tools, looking for outdoor furniture',
      price: null,
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
    {
      type: 'announce' as const,
      title: 'Community Cleanup Day',
      description: 'Join us for beach cleanup this Saturday at 9 AM',
      price: null,
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
    {
      type: 'wanted' as const,
      title: 'Annapolis Boat Detailing',
      description: 'Professional boat cleaning and detailing services',
      price: 'From $200',
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-white min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-hsc-text">
          Liquid Glass Design System
        </h1>
        <p className="text-lg text-hsc-text/70">
          Apple-inspired glass effects for HSC
        </p>
      </div>

      {/* Type Selector */}
      <div className="flex justify-center space-x-4">
        {(['sell', 'trade', 'announce', 'wanted'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`
              px-6 py-3 rounded-hsc font-medium transition-all duration-300
              glass-${type} text-white
              ${selectedType === type ? 'ring-2 ring-white/30' : ''}
            `}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Glass Effects Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {demoCards.map((card, index) => (
          <div
            key={index}
            className={`
              group relative p-6 rounded-hsc glass-${card.type} glass-morph
              transition-all duration-400 hover:shadow-glass-glow-${card.type}
              ${selectedType === card.type ? 'ring-2 ring-white/30' : ''}
              overflow-hidden
            `}
            style={{
              backgroundImage: `url(${card.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 glass-shimmer rounded-hsc" />
            
            {/* Content */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`
                  px-3 py-1 text-xs font-semibold rounded-full
                  bg-white/20 text-black backdrop-blur-sm
                `}>
                  {card.type.toUpperCase()}
                </span>
                {card.price && (
                  <span className="text-lg font-bold text-black">
                    {card.price}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-black">
                {card.title}
              </h3>
              
              <p className="text-sm text-black/80 leading-relaxed">
                {card.description}
              </p>
              
              {/* Glass button */}
              <button className="
                w-full mt-4 px-4 py-2 glass-button rounded-lg
                text-black font-medium
                hover:scale-105 transition-transform duration-200
              ">
                View Details
              </button>
            </div>

            {/* Floating animation on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 animate-glass-float" />
            </div>
          </div>
        ))}
      </div>

      {/* Glass Modal Demo */}
      <div className="text-center">
        <button className="
          px-8 py-4 glass-modal rounded-hsc text-black font-semibold
          hover:glass-morph transition-all duration-300
          shadow-glass-xl
        ">
          Glass Modal Example
        </button>
      </div>

      {/* Utility Classes Reference */}
      <div className="mt-12 p-6 glass rounded-hsc">
        <h2 className="text-2xl font-bold text-hsc-text mb-4">
          Available Glass Utilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-hsc-text">Base Glass</h3>
            <ul className="space-y-1 text-hsc-text/70">
              <li><code>.glass</code> - Basic glass effect</li>
              <li><code>.glass-dark</code> - Dark glass variant</li>
              <li><code>.glass-modal</code> - Modal overlay</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-hsc-text">Listing Types</h3>
            <ul className="space-y-1 text-hsc-text/70">
              <li><code>.glass-sell</code> - Green sell glass</li>
              <li><code>.glass-trade</code> - Yellow trade glass</li>
              <li><code>.glass-announce</code> - Blue announce glass</li>
                              <li><code>.glass-wanted</code> - Purple wanted glass</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-hsc-text">Interactions</h3>
            <ul className="space-y-1 text-hsc-text/70">
              <li><code>.glass-morph</code> - Hover morph effect</li>
              <li><code>.glass-shimmer</code> - Shimmer animation</li>
              <li><code>.glass-button</code> - Interactive button</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Border Radius Utilities */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 glass rounded-hsc text-center">
          <div className="text-sm font-medium text-hsc-text">rounded-hsc</div>
          <div className="text-xs text-hsc-text/60">HSC signature</div>
        </div>
        <div className="p-4 glass rounded-hsc-reverse text-center">
          <div className="text-sm font-medium text-hsc-text">rounded-hsc-reverse</div>
          <div className="text-xs text-hsc-text/60">Reverse variant</div>
        </div>
        <div className="p-4 glass rounded-hsc-top text-center">
          <div className="text-sm font-medium text-hsc-text">rounded-hsc-top</div>
          <div className="text-xs text-hsc-text/60">Top only</div>
        </div>
        <div className="p-4 glass rounded-hsc-bottom text-center">
          <div className="text-sm font-medium text-hsc-text">rounded-hsc-bottom</div>
          <div className="text-xs text-hsc-text/60">Bottom only</div>
        </div>
      </div>

      {/* Top Right ChatBot Interface Demo */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-hsc-text text-center">
          Top-Right Positioned ChatBot with LQ Effects
        </h2>
        
        {/* Mock Header Layout */}
        <div className="relative bg-gray-100 rounded-lg p-4 min-h-[120px]">
          <div className="flex justify-between items-start">
            {/* Left side - Logo area */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                HSC
              </div>
              <div className="text-lg font-semibold text-gray-700">Hillsmere Shores Classifieds</div>
            </div>
            
            {/* Right side - Post buttons and Chat */}
            <div className="flex items-start space-x-4">
              {/* Post Buttons */}
              <div className="flex space-x-2">
                <button className="glass-sell px-4 py-2 rounded-hsc text-white font-medium text-sm">
                  FOR SALE
                </button>
                <button className="glass-trade px-4 py-2 rounded-hsc text-white font-medium text-sm">
                  TRADE
                </button>
                <button className="glass-announce px-4 py-2 rounded-hsc text-white font-medium text-sm">
                  ANNOUNCE
                </button>
              </div>
              
              {/* Compact Chat Interface */}
              <div className="relative">
                {/* Chat Toggle Button with Rainbow Glass & Jingle */}
                <button 
                  id="chat-toggle-btn"
                  className="glass rounded-full w-12 h-12 flex items-center justify-center text-white hover:glass-morph transition-all duration-200 shadow-lg animate-rainbow-shift animate-attention-pulse backdrop-blur-glass-xl border-2 rainbow-chat-button"
                  title="Open Chat Assistant"
                  style={{
                    animationDelay: '0s, 2s',
                    transformOrigin: 'center center'
                  }}
                  onMouseEnter={(e) => {
                    if (e.currentTarget && e.currentTarget.classList) {
                      // Add jingle animation
                      e.currentTarget.classList.add('animate-chat-jingle');
                      // Switch to faster hover animation with purple
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
                      // Switch back to normal animation
                      e.currentTarget.classList.remove('animate-rainbow-shift-hover');
                      e.currentTarget.classList.add('animate-rainbow-shift');
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                
                {/* Chat Panel - Appears on click */}
                <div 
                  id="chat-panel" 
                  className="absolute top-14 right-0 w-80 glass-dark rounded-hsc shadow-xl opacity-0 invisible transform translate-y-2 transition-all duration-300 z-50"
                >
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">HSC Assistant</h3>
                      <button 
                        id="chat-close-btn"
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Chat Messages Area */}
                  <div id="chat-messages" className="h-64 overflow-y-auto p-4 space-y-3">
                    <div className="glass rounded-lg p-3">
                      <div className="text-white text-sm">
                        👋 Hi! I'm your HSC assistant. Ask me about listings, categories, or how to post!
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Input Area */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Ask me anything..." 
                        className="flex-1 px-3 py-2 glass rounded-lg text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                        id="chat-input"
                      />
                      <button 
                        id="chat-send-btn"
                        className="glass-announce px-4 py-2 rounded-lg text-white hover:glass-morph transition-all duration-200"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polyline points="22,2 15,22 11,13 2,9 22,2"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Bubble Variations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-hsc-text">Standard Bubble</h4>
            <div className="glass rounded-hsc p-4">
              <div className="text-sm text-black">
                Hello! I'm the HSC assistant. How can I help you today?
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-hsc-text">Announcement Bubble</h4>
            <div className="glass-announce rounded-hsc p-4">
              <div className="text-sm text-white">
                📢 New community event posted! Beach cleanup this Saturday.
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-hsc-text">Sell Alert Bubble</h4>
            <div className="glass-sell rounded-hsc p-4">
              <div className="text-sm text-white">
                💰 Great! I found 3 boats for sale in your area.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Initialize ChatBot */}
      <ChatBot />
    </div>
  );
} 