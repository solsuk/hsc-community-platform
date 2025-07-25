import React from 'react';

interface FooterProps {
  siteName?: string;
  tagline?: string;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ 
  siteName = "HSC", 
  tagline = "Hyper localized community solutions",
  className = ""
}) => {
  return (
    <footer className={`bg-black text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Branding */}
        <div className="text-center mb-8">
          <h2 className="footer-brand text-4xl md:text-5xl font-black tracking-wider mb-3">
            {siteName}/MATAKEY.COM
          </h2>
          <p className="footer-tagline text-lg md:text-xl text-gray-300 italic">
            {tagline}
          </p>
        </div>

        {/* Navigation Links */}
        <div className="text-center mb-8">
          {/* Desktop: Inline with bullets, Mobile: Stacked */}
          <div className="hidden md:flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-base">
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Advertise with us!
            </a>
            <span className="text-gray-500">•</span>
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Contact
            </a>
            <span className="text-gray-500">•</span>
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Report Listing
            </a>
            <span className="text-gray-500">•</span>
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Suggestions?
            </a>
          </div>

          {/* Mobile: Stacked vertically */}
          <div className="md:hidden flex flex-col items-center gap-y-4 text-base">
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Advertise with us!
            </a>
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Contact
            </a>
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Report Listing
            </a>
            <a href="#" className="footer-link hover:text-gray-300 transition-colors duration-200">
              Suggestions?
            </a>
          </div>

          {/* Secondary Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm text-gray-400 mt-6">
            <a href="#" className="hover:text-white transition-colors duration-200">
              Privacy
            </a>
            <span className="hidden md:inline text-gray-600">•</span>
            <a href="#" className="hover:text-white transition-colors duration-200">
              Terms
            </a>
            <span className="hidden md:inline text-gray-600">•</span>
            <a href="#" className="hover:text-white transition-colors duration-200">
              About Matakey
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-gray-500 border-t border-gray-800 pt-6">
          © 2025 Matakey. Serving communities.
        </div>
      </div>

      <style jsx>{`
        .footer-brand {
          font-family: 'Futura', 'Futura PT', 'Helvetica Neue', Arial, sans-serif;
        }
        .footer-tagline {
          font-family: 'Futura', 'Futura PT', 'Helvetica Neue', Arial, sans-serif;
        }
        .footer-link {
          font-family: 'Futura', 'Futura PT', 'Helvetica Neue', Arial, sans-serif;
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .footer-brand {
            font-size: 2rem;
            line-height: 1.1;
          }
          .footer-tagline {
            font-size: 1rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer; 