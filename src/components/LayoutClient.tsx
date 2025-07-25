'use client';

import { useState } from 'react';
import ClientWrapper from './ClientWrapper';
import ListingForm from './ListingForm';
import NomadsHeader from './NomadsHeader';
import BusinessAdvertiser from './BusinessAdvertiser';
import Footer from './Footer';

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'sell' | 'trade' | 'announce' | 'wanted' | null>(null);
  const [isBusinessAdvertiserOpen, setIsBusinessAdvertiserOpen] = useState(false);

  const handleTypeSelect = (type: 'sell' | 'trade' | 'announce' | 'wanted') => {
    setSelectedType(type);
    setIsFormOpen(true);
  };

  const handleFormOpen = () => {
    setIsFormOpen(true);
  };

  const handleBusinessAdvertiserOpen = () => {
    setIsBusinessAdvertiserOpen(true);
  };

  return (
    <>
      {/* New Nomads-style Header */}
      <NomadsHeader 
        onPostTypeSelect={handleTypeSelect}
        onFormOpen={handleFormOpen}
        onBusinessAdvertiserOpen={handleBusinessAdvertiserOpen}
      />
      
      {/* Main content with spacing buffer before footer */}
      <div className="bg-white min-h-screen pb-24">
        <main>
          {children}
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Load our ChatBot component through the client wrapper */}
      <ClientWrapper />

      {/* Listing Form */}
      <ListingForm 
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedType(null);
        }}
        initialType={selectedType}
      />

      {/* Business Advertiser */}
      <BusinessAdvertiser 
        isOpen={isBusinessAdvertiserOpen}
        onClose={() => setIsBusinessAdvertiserOpen(false)}
      />
    </>
  );
} 