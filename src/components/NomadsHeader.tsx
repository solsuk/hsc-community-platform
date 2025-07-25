'use client';

import { useState, useEffect } from 'react';
import AuthStatus from './AuthStatus';
import { useAuth } from '@/hooks/useAuth';

interface NomadsHeaderProps {
  onPostTypeSelect: (type: 'sell' | 'trade' | 'announce' | 'wanted') => void;
  onFormOpen: () => void;
  onBusinessAdvertiserOpen: () => void;
}

export default function NomadsHeader({ onPostTypeSelect, onFormOpen, onBusinessAdvertiserOpen }: NomadsHeaderProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [chatResponse, setChatResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatListings, setChatListings] = useState<any[]>([]);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [isAdvertiseExpanded, setIsAdvertiseExpanded] = useState(false);
  const [advertiseEmail, setAdvertiseEmail] = useState('');
  const [isAdvertiseLoading, setIsAdvertiseLoading] = useState(false);
  const [showAdvertiseSuccess, setShowAdvertiseSuccess] = useState(false);
  
  // Add authentication state
  const { user, authenticated, loading } = useAuth();

  // Check if user is verified (community verified or admin)
  const isVerified = authenticated && user && (user.communityVerified || user.isAdmin);

  const placeholders = [
    "Hillsmere Shores Classifieds",
    "Connect, For Sale, Trade, Join!--> ",
    "Hillsmere Shores Classifieds",
    "Questions? Type your question here!"
  ];

  // Typewriter effect for placeholder texts
  useEffect(() => {
    let messageIndex = 0;
    
    const typeMessage = () => {
      const currentMessage = placeholders[messageIndex];
      let charIndex = 0;
      
      const type = () => {
        if (charIndex < currentMessage.length) {
          setCurrentPlaceholder(currentMessage.slice(0, charIndex + 1));
          charIndex++;
          setTimeout(type, 100);
        } else {
          // Wait 2 seconds then move to next message
          setTimeout(() => {
            messageIndex = (messageIndex + 1) % placeholders.length;
            typeMessage();
          }, 2000);
        }
      };
      
      type();
    };
    
    typeMessage();
  }, []);

  // Handle ESC key to close chat modal and advertise form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isChatOpen) {
          setIsChatOpen(false);
        }
        if (isAdvertiseExpanded) {
          setIsAdvertiseExpanded(false);
          setAdvertiseEmail('');
        }
        if (showAdvertiseSuccess) {
          setShowAdvertiseSuccess(false);
        }
      }
    };

    if (isChatOpen || isAdvertiseExpanded || showAdvertiseSuccess) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isChatOpen, isAdvertiseExpanded, showAdvertiseSuccess]);

  // Handle POST! button click
  const handlePostButtonClick = () => {
    // Check if user is verified before opening form
    if (!isVerified) {
      setShowVerificationMessage(true);
      setTimeout(() => setShowVerificationMessage(false), 5000);
      return;
    }
    
    // Default to 'sell' type and open form directly
    onPostTypeSelect('sell');
    onFormOpen();
  };

  // Handle chat functionality
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setIsLoading(true);
    setIsChatOpen(true);
    setChatResponse('');
    setChatListings([]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.message || 'I apologize, but I received an empty response.');
        if (data.listings && data.listings.length > 0) {
          setChatListings(data.listings);
        }
      } else {
        setChatResponse('I apologize, but I\'m having trouble connecting right now. Please try again later!');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatResponse('I apologize, but I\'m having trouble connecting right now. Please try again later!');
    }
    
    setIsLoading(false);
    setChatMessage('');
  };

  // Handle advertiser magic link
  const handleAdvertiseMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!advertiseEmail.trim()) return;
    
    setIsAdvertiseLoading(true);
    
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: advertiseEmail.trim(),
          context: 'business_advertising'
        })
      });
      
      if (response.ok) {
        // Success! Business advertiser will get auto-verified magic link
        setShowAdvertiseSuccess(true);
        setTimeout(() => setShowAdvertiseSuccess(false), 8000);
        setIsAdvertiseExpanded(false);
        setAdvertiseEmail('');
      } else {
        console.error('Failed to send magic link for advertiser');
      }
    } catch (error) {
      console.error('Error sending advertiser magic link:', error);
    }
    
    setIsAdvertiseLoading(false);
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* POST! Button and Premium Advertiser - Left */}
          <div className="relative flex items-center space-x-3">
            <button
              onClick={handlePostButtonClick}
              className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                isVerified 
                  ? 'border-green-500 text-green-500 bg-white hover:bg-green-500 hover:text-white' 
                  : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
              disabled={!isVerified}
              title={!isVerified ? 'Only verified community members can create listings' : 'Create a new listing'}
            >
              POST!
            </button>

            {/* Advertise Button - Show for everyone */}
            {isVerified ? (
              <button
                onClick={onBusinessAdvertiserOpen}
                className="inline-flex items-center px-3 py-2 border border-orange-500 text-orange-500 bg-white hover:bg-orange-500 hover:text-white rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                title="Create and manage your business advertisements"
              >
                <span className="mr-1">📢</span>
                Advertise!
              </button>
            ) : (
              <>
                {!isAdvertiseExpanded ? (
                  <button
                    onClick={() => setIsAdvertiseExpanded(true)}
                    className="inline-flex items-center px-3 py-2 border border-orange-500 text-orange-500 bg-white hover:bg-orange-500 hover:text-white rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    title="Get started with business advertising"
                  >
                    <span className="mr-1">📢</span>
                    Advertise!
                  </button>
                ) : (
                  <form onSubmit={handleAdvertiseMagicLink} className="relative">
                    <div className="flex items-center bg-orange-500 rounded-lg border border-orange-500 shadow-sm overflow-hidden transition-all duration-300">
                      <input
                        type="email"
                        value={advertiseEmail}
                        onChange={(e) => setAdvertiseEmail(e.target.value)}
                        placeholder="business@example.com"
                        className="flex-1 px-3 py-2 bg-transparent text-white placeholder-orange-200 text-sm focus:outline-none min-w-0"
                        disabled={isAdvertiseLoading}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!advertiseEmail.trim() || isAdvertiseLoading}
                        className={`px-3 py-2 bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-l border-orange-400 ${!(!advertiseEmail.trim() || isAdvertiseLoading) ? 'animate-pulse-glow' : ''}`}
                      >
                        {isAdvertiseLoading ? '...' : '📢'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Chat/Search Field - Always Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-8">
            <form onSubmit={handleChatSubmit} className="relative">
              <div className="chat-logo">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={currentPlaceholder}
                  className="w-full"
                />
              </div>
            </form>
          </div>

          {/* Auth Status - Right */}
          <div className="flex items-center space-x-4">
            <AuthStatus />
          </div>
        </div>
      </div>

      {/* Chat Response Modal */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsChatOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">HSC Assistant</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-600">Thinking...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Response */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {chatResponse}
                    </div>
                  </div>

                  {/* Listings if any */}
                  {chatListings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Related Listings:</h4>
                      {chatListings.map((listing, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="font-medium text-gray-900">{listing.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{listing.description}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            Type: {listing.type} • Posted: {new Date(listing.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Business Advertiser Success Message Toast */}
      {showAdvertiseSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                📢 Business Advertising Link Sent!
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                Check your email for your business advertising access link. You'll have immediate access to create professional ads with no approval needed!
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => setShowAdvertiseSuccess(false)}
                className="bg-orange-50 rounded-md inline-flex text-orange-400 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-orange-50 focus:ring-orange-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Message Toast */}
      {showVerificationMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                Verification Required
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                Only verified community members can create listings. Please request community verification through the admin panel.
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => setShowVerificationMessage(false)}
                className="bg-amber-50 rounded-md inline-flex text-amber-400 hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 