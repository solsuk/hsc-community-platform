'use client';

import { useState, useEffect } from 'react';

export default function NYBGGlassDemo() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedType, setSelectedType] = useState<'sell' | 'trade' | 'announce' | 'wanted'>('sell');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock login state
  const [userEmail, setUserEmail] = useState('user@hillsmereshores.com'); // Mock user email

  // Handle scroll behavior for shrinking header
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Setup compact chatbot functionality
  useEffect(() => {
    const setupCompactChatbot = () => {
      const toggleBtn = document.getElementById('nybg-chat-toggle-btn') as HTMLButtonElement;
      const closeBtn = document.getElementById('nybg-chat-close-btn') as HTMLButtonElement;
      const chatPanel = document.getElementById('nybg-chat-panel') as HTMLElement;
      const chatInput = document.getElementById('nybg-chat-input') as HTMLInputElement;
      const sendBtn = document.getElementById('nybg-chat-send-btn') as HTMLButtonElement;
      const messagesContainer = document.getElementById('nybg-chat-messages') as HTMLElement;
      
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
            <div class="text-white text-sm font-bold">${message}</div>
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
          <div class="glass rounded-lg p-3 max-w-xs border-2 border-black/20">
            <div class="text-black text-sm font-semibold">${message}</div>
        `;
        
        // Add listings if provided (but limit to 2-3 for compact display)
        if (listings && listings.length > 0) {
          content += '<div class="mt-2 space-y-1">';
          listings.slice(0, 2).forEach((listing: any) => {
            content += `
              <div class="glass-sell rounded p-2 border border-black/10">
                <div class="text-black text-xs font-bold">${listing.title}</div>
                <div class="text-black/70 text-xs">${listing.description.substring(0, 60)}...</div>
              </div>
            `;
          });
          if (listings.length > 2) {
            content += `<div class="text-black/60 text-xs font-medium">...and ${listings.length - 2} more</div>`;
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
          <div class="glass rounded-lg p-3 border-2 border-black/20">
            <div class="text-black text-sm font-semibold">Typing...</div>
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
      title: 'WATERFRONT KAYAK SET',
      description: 'Professional-grade kayaks perfect for Hillsmere Shores waterfront adventures',
      price: '$1,250',
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
    {
      type: 'trade' as const,
      title: 'NEIGHBORHOOD TOOL EXCHANGE',
      description: 'Trade quality tools with your Hillsmere Shores neighbors',
      price: null,
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
    {
      type: 'announce' as const,
      title: 'COMMUNITY DOCK CLEANUP',
      description: 'Join our waterfront restoration initiative this Saturday morning',
      price: null,
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
    {
      type: 'wanted' as const,
      title: 'PROFESSIONAL MARINE SERVICES',
      description: 'Expert boat maintenance and dock repair services for the community',
      price: 'From $150',
      image: '/images/hillsmere-shores-md-2439300.gif',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HSC Header with NYBG-Inspired Scroll Behavior */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg py-2' 
          : 'bg-transparent py-6'
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
                    <button className="w-full text-left px-4 py-2 text-black font-bold hover:glass-announce rounded transition-all duration-200">
                      {isLoggedIn ? userEmail : 'UNLOCK!'}
                    </button>
                    {isLoggedIn && (
                      <>
                                        <button className="w-full text-left px-4 py-2 text-black font-bold hover:glass-sell rounded transition-all duration-200">
                  FOR SALE
                </button>
                        <button className="w-full text-left px-4 py-2 text-black font-bold hover:glass-announce rounded transition-all duration-200">
                          ANNOUNCE
                        </button>
                        <button className="w-full text-left px-4 py-2 text-black font-bold hover:glass-trade rounded transition-all duration-200">
                          TRADE
                        </button>
                                                  <button className="w-full text-left px-4 py-2 text-black font-bold hover:glass-wanted rounded transition-all duration-200">
                            WANTED
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logo - Shrinks and moves to center when scrolled */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-out ${
              isScrolled ? 'scale-75' : 'scale-100'
            }`}>
              <div className="text-center">
                <h1 className={`font-black tracking-tight transition-all duration-500 text-center ${
                  isScrolled ? 'text-4xl' : 'text-7xl'
                } text-black drop-shadow-lg`}>
                  HSC
                </h1>
                <p className={`font-bold text-black/70 transition-all duration-500 text-center ${
                  isScrolled ? 'text-xs' : 'text-sm'
                } drop-shadow-sm`}>
                  HILLSMERE SHORES CLASSIFIEDS
                </p>
              </div>
            </div>

            {/* Right Side Navigation - Fixed Position */}
            <div className="flex items-center space-x-2">
              {/* Chat Button - Category Style with Rainbow Effects */}
              <button 
                id="nybg-chat-toggle-btn"
                className="px-6 py-4 rounded-lg font-black text-lg transition-all duration-300 border-2 border-black glass-trade text-white shadow-lg hover:scale-105 rainbow-chat-button animate-rainbow-shift animate-attention-pulse"
                title="Open HSC Assistant"
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                CHAT
              </button>

              {/* Unlock/Get Access Button - Category Style */}
              <button 
                onClick={() => setIsLoggedIn(!isLoggedIn)}
                className="px-8 py-4 rounded-lg font-black text-lg transition-all duration-300 border-2 border-black glass-announce text-white shadow-lg hover:scale-105"
              >
                {isLoggedIn ? 'LOGGED IN' : 'UNLOCK'}
              </button>
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
        id="nybg-chat-panel" 
        className="fixed top-20 right-6 w-80 glass-dark rounded-lg shadow-xl opacity-0 invisible transform translate-y-2 transition-all duration-300 z-50 border-2 border-black"
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-black/20 bg-black text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-sm">HSC ASSISTANT</h3>
            <button 
              id="nybg-chat-close-btn"
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
        <div id="nybg-chat-messages" className="h-64 overflow-y-auto p-4 space-y-3 bg-white">
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
              id="nybg-chat-input"
            />
            <button 
              id="nybg-chat-send-btn"
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

              {/* Hero Section - HSC Bold Typography */}
        <section className="pt-32 pb-16 px-6" style={{
          backgroundImage: 'url(/images/hillsmere-shores-md-2439300.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}>
          <div className="container mx-auto text-center">
            <div className="glass-dark rounded-lg p-12 border-4 border-black max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
                COMMUNITY
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400">
                  CONNECTED
                </span>
              </h1>
              <p className="text-xl md:text-2xl font-bold text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Where neighborhood commerce meets liquid glass design. 
                Professional-grade marketplace for Hillsmere Shores community.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="glass-sell px-8 py-4 rounded-lg text-white font-black text-lg border-2 border-white/30 hover:scale-105 transition-all duration-300">
                  BROWSE LISTINGS
                </button>
                <button className="glass-announce px-8 py-4 rounded-lg text-white font-black text-lg border-2 border-white/30 hover:scale-105 transition-all duration-300">
                  JOIN COMMUNITY
                </button>
              </div>
            </div>
          </div>
        </section>

              

              {/* Cards Grid - HSC Professional Style */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoCards.map((card, index) => (
              <div
                key={index}
                className={`
                  group relative rounded-lg glass-morph transition-all duration-400 border-2 border-black/20
                  glass-${card.type} hover:shadow-glass-glow-${card.type} hover:scale-105 overflow-hidden
                `}
                style={{
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Glass pane overlay that dissolves on hover */}
                <div className="absolute inset-0 glass-dark backdrop-blur-[12px] transition-all duration-400 group-hover:backdrop-blur-[1px] group-hover:bg-black/5"></div>
                
                {/* Content container */}
                <div className="relative z-10 p-6 m-2">
                  {/* Listing type label with proper coloring */}
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-black mb-3 glass-${card.type} text-white border border-white/30`}>
                    {card.type.toUpperCase()}
                  </div>
                  
                  <h3 className="text-lg font-black text-white mb-2 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/90 mb-4 font-medium drop-shadow-sm">
                    {card.description}
                  </p>
                  {card.price && (
                    <div className="text-2xl font-black text-white">
                      {card.price}
                    </div>
                  )}
                  <button className="mt-4 w-full glass-button px-4 py-2 rounded-lg text-black font-bold border border-white/30 hover:bg-white/20 transition-all duration-300">
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

              {/* Features Section - HSC Grid System */}
        <section className="py-16 px-6 bg-white">
          <div className="container mx-auto">
            <h2 className="text-5xl font-black text-black text-center mb-12 tracking-tight">
              GLASS EFFECTS × HSC BOLDNESS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass rounded-lg p-8 border-2 border-black/20 hover:glass-morph transition-all duration-300">
                <h3 className="text-2xl font-black text-black mb-4">INSTITUTIONAL TYPOGRAPHY</h3>
                <p className="text-black/80 font-medium">Bold, confident typefaces inspired by civic design and neighborhood pride.</p>
              </div>
              <div className="glass rounded-lg p-8 border-2 border-black/20 hover:glass-morph transition-all duration-300">
                <h3 className="text-2xl font-black text-black mb-4">LIQUID GLASS EFFECTS</h3>
                <p className="text-black/80 font-medium">Apple-inspired translucent surfaces with professional-grade blur effects and depth.</p>
              </div>
            </div>
          </div>
        </section>

              {/* Footer - HSC Style */}
        <footer className="bg-black text-white py-12 px-6">
          <div className="container mx-auto text-center">
            <h3 className="text-3xl font-black mb-4">HSC GLASS DESIGN SYSTEM</h3>
            <p className="text-white/80 font-medium mb-6">
              Where neighborhood excellence meets liquid glass elegance
            </p>
            <div className="flex justify-center space-x-6">
              <button className="glass-button px-6 py-3 rounded-lg text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300 font-bold">
                COMMUNITY GUIDE
              </button>
              <button className="glass-button px-6 py-3 rounded-lg text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300 font-bold">
                GET STARTED
              </button>
            </div>
          </div>
        </footer>
    </div>
  );
} 