// This will run when the script loads
function setupPlaceholderRotation() {
  const inputElement = document.querySelector('.rotating-placeholder');
  
  if (inputElement) {
    const placeholders = [
      "Need assistance?", 
      "Ask me!", 
      "How do I list an item?", 
      "How do I log-in?"
    ];
    
    let currentIndex = 0;
    
    // Set initial placeholder
    inputElement.setAttribute('placeholder', placeholders[currentIndex]);
    
    // Change placeholder every 3 seconds
    setInterval(() => {
      currentIndex = (currentIndex + 1) % placeholders.length;
      inputElement.setAttribute('placeholder', placeholders[currentIndex]);
    }, 3000);
    
    console.log('Placeholder rotation initialized');
  } else {
    console.log('Input element not found');
  }
}

// Run when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPlaceholderRotation);
} else {
  // If DOMContentLoaded has already fired, run immediately
  setupPlaceholderRotation();
}

// Also run when the window loads (for safer measure)
window.addEventListener('load', setupPlaceholderRotation); 