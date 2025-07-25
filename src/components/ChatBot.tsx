'use client';

import { useEffect, useRef } from 'react';

export default function ChatBot() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log('ChatBot component mounted');
    setupHelpBot();
    
    // Cleanup function
    return () => {
      console.log('ChatBot component unmounted');
    };
  }, []);

  function setupHelpBot() {
    console.log('Setting up help bot...');
    
    const input = document.getElementById('help-input') as HTMLInputElement;
    const resultsContainer = document.getElementById('help-results') as HTMLElement;
    
    if (!input || !resultsContainer) {
      console.error('Help bot elements not found:', { 
        input: !!input, 
        resultsContainer: !!resultsContainer 
      });
      return;
    }
    
    console.log('Help bot elements found, continuing setup');
    
    // Store last response for potential reuse
    let lastResponse = '';
    
    // Rotating placeholder messages
    const placeholders = [
      "Need assistance?", 
      "Ask!", 
      "Search listings", 
      "FAQ",
      "Contact the admin!",
      "Help Bot"
    ];
    
    let currentIndex = 0;
    let rotationInterval: NodeJS.Timeout | null = null;
    let userIsInteracting = false;
    let animating = false;
    
    // Animation durations (in ms)
    const animationDuration = 1000;
    const displayDuration = 3000; // 3 seconds between changes
    
    // Function to animate placeholder change
    function animatePlaceholderChange() {
      if (animating || userIsInteracting) return;
      
      animating = true;
      
      // First slide current placeholder out
      input.classList.add('placeholder-slide-out');
      
      // After sliding out, change placeholder and slide in
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % placeholders.length;
        input.placeholder = placeholders[currentIndex];
        input.classList.remove('placeholder-slide-out');
        input.classList.add('placeholder-slide-in');
        
        // Remove slide-in class after animation completes
        setTimeout(() => {
          input.classList.remove('placeholder-slide-in');
          animating = false;
        }, animationDuration);
      }, animationDuration);
    }
    
    // Function to start the rotation
    function startRotation() {
      if (rotationInterval === null) {
        setTimeout(() => {
          rotationInterval = setInterval(animatePlaceholderChange, displayDuration + (animationDuration * 2));
        }, 1000);
      }
    }
    
    // Function to stop the rotation
    function stopRotation() {
      if (rotationInterval !== null) {
        clearInterval(rotationInterval);
        rotationInterval = null;
      }
    }
    
    // Function to show a bot response
    function showBotResponse(response: any) {
      console.log('Showing bot response:', response);
      
      // Clear previous content
      resultsContainer.innerHTML = '';
      
      // Show the results container
      resultsContainer.classList.add('active');
      resultsContainer.style.visibility = 'visible';
      resultsContainer.style.opacity = '1';
      resultsContainer.style.transform = 'translateY(0)';
      
      // Also update the parent help-content element
      const helpContent = document.querySelector('.help-content');
      if (helpContent) {
        helpContent.classList.add('has-active-results');
      }
      
      // Create message element
      const messageDiv = document.createElement('div');
      messageDiv.className = 'bot-message';
      messageDiv.innerText = response.message;
      
      // Add to DOM
      resultsContainer.appendChild(messageDiv);
      
      // If it's a listing search with results, show them
      if (response.type === 'listing_search' && response.listings && response.listings.length > 0) {
        const listingsDiv = document.createElement('div');
        listingsDiv.className = 'listings-results';
        
        response.listings.forEach((listing: any) => {
          const listingDiv = document.createElement('div');
          listingDiv.className = 'listing-item';
          listingDiv.innerHTML = `
            <h4>${listing.title}</h4>
            <p>${listing.description.substring(0, 100)}...</p>
            <small>Type: ${listing.type} | Posted: ${new Date(listing.created_at).toLocaleDateString()}</small>
          `;
          listingsDiv.appendChild(listingDiv);
        });
        
        resultsContainer.appendChild(listingsDiv);
      }
      
      // Store last response
      lastResponse = response.message;
    }
    
    // Function to get a bot response from API
    async function getBotResponse(query: string) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: query }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error getting bot response:', error);
        return {
          type: 'error',
          message: "I'm having trouble right now. Please try again in a moment!"
        };
      }
    }
    
    // Function to handle user input
    async function handleUserInput(e?: KeyboardEvent) {
      if (e && e.key !== 'Enter') return;
      
      const query = (input as HTMLInputElement).value.trim();
      if (!query) return;
      
      console.log('User query:', query);
      
      // Show loading state
      resultsContainer.innerHTML = '<div class="bot-message">Thinking...</div>';
      resultsContainer.classList.add('active');
      resultsContainer.style.visibility = 'visible';
      resultsContainer.style.opacity = '1';
      resultsContainer.style.transform = 'translateY(0)';
      
      // Get response from API
      const response = await getBotResponse(query);
      showBotResponse(response);
      
      // Clear input
      (input as HTMLInputElement).value = '';
    }
    
    // Function to clear chat
    const clearChat = () => {
      resultsContainer.innerHTML = '';
      resultsContainer.classList.remove('active');
      resultsContainer.style.visibility = 'hidden';
      resultsContainer.style.opacity = '0';
      resultsContainer.style.transform = 'translateY(-10px)';
      
      const helpContent = document.querySelector('.help-content');
      if (helpContent) {
        helpContent.classList.remove('has-active-results');
      }
      
      lastResponse = '';
    };
    
    // Event listeners
    input.addEventListener('keydown', handleUserInput);
    input.addEventListener('focus', () => {
      userIsInteracting = true;
      stopRotation();
    });
    input.addEventListener('blur', () => {
      userIsInteracting = false;
      startRotation();
    });
    
    // Add close button functionality
    const closeButton = document.createElement('button');
    closeButton.className = 'close-chat';
    closeButton.innerHTML = '×';
    closeButton.onclick = clearChat;
    resultsContainer.appendChild(closeButton);
    
    // Start placeholder rotation
    startRotation();
    
    console.log('Help bot setup complete');
  }

  return null; // This component doesn't render anything directly
} 