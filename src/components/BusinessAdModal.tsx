import { useState } from 'react';

interface BusinessAdModalProps {
  listing: {
    id: string;
    user_id: string;
    title: string;
    basic_description: string;
    detailed_description: string;
    featured_image_url?: string;
    image_urls?: string[];
    created_at: string;
    clicks: number;
  };
  user?: {
    id: string;
  } | null;
  authenticated: boolean;
  onEditListing?: (listing: any) => void;
}

export default function BusinessAdModal({ listing, user, authenticated, onEditListing }: BusinessAdModalProps) {
  // Parse business information from listing data
  const parsedBusiness = {
    business_name: listing.title.split(' - ')[0] || listing.title,
    headline: listing.title.includes(' - ') ? listing.title.split(' - ').slice(1).join(' - ') : listing.basic_description,
    description: listing.detailed_description || listing.basic_description,
    featured_image: listing.featured_image_url,
    gallery_images: listing.image_urls || [],
    // Extract business type from title/description
    business_type: listing.title.toLowerCase().includes('pizza') || listing.title.toLowerCase().includes('restaurant') ? 'restaurant' :
                   listing.title.toLowerCase().includes('plumbing') || listing.title.toLowerCase().includes('service') ? 'service' :
                   listing.title.toLowerCase().includes('boutique') || listing.title.toLowerCase().includes('style') ? 'retail' :
                   listing.title.toLowerCase().includes('law') || listing.title.toLowerCase().includes('attorney') ? 'professional' : 'other'
  };

  // Extract contact info from description (basic parsing)
  const extractContactInfo = () => {
    const description = listing.detailed_description || listing.basic_description || '';
    
    // Extract phone number
    const phoneMatch = description.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';
    
    // Extract website
    const websiteMatch = description.match(/(?:www\.|https?:\/\/)[^\s]+/);
    const website = websiteMatch ? websiteMatch[0] : '';
    
    // Extract address (look for patterns with MD, Annapolis, etc.)
    const addressMatch = description.match(/\d+[^,]*(?:St|Ave|Dr|Rd)[^,]*,\s*[^,]*,?\s*(?:MD|Maryland)/i);
    const address = addressMatch ? addressMatch[0] : '';
    
    return { phone, website, address };
  };

  const contactInfo = extractContactInfo();

  // Extract hours for restaurants
  const extractHours = () => {
    const description = listing.detailed_description || listing.basic_description || '';
    const hoursMatch = description.match(/(?:open|hours?).*?(?:\d{1,2}(?::\d{2})?\s*(?:AM|PM).*?\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
    return hoursMatch ? hoursMatch[0] : '';
  };

  const hours = extractHours();

  // Extract special offers/discounts
  const extractOffers = () => {
    const description = listing.detailed_description || listing.basic_description || '';
    const offers = [];
    
    // Look for percentage discounts
    const percentMatch = description.match(/(\d+%\s*off[^.!]*)/i);
    if (percentMatch) offers.push(percentMatch[1]);
    
    // Look for dollar discounts  
    const dollarMatch = description.match(/(\$\d+\s*off[^.!]*)/i);
    if (dollarMatch) offers.push(dollarMatch[1]);
    
    return offers;
  };

  const specialOffers = extractOffers();

  // Check if current user owns this listing
  const isOwner = authenticated && user?.id === listing.user_id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Business Ad Preview */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-6 shadow-lg">
                 {/* Business Header */}
         <div className="flex items-start justify-between mb-4">
           <div className="flex-1">
             <div className="flex items-center space-x-2 mb-2">
               <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                 Ad
               </span>
               <span className="text-sm text-gray-500">
                 {parsedBusiness.business_type === 'restaurant' ? 'Restaurant/Food Service' :
                  parsedBusiness.business_type === 'service' ? 'Service Business' :
                  parsedBusiness.business_type === 'retail' ? 'Retail/Shopping' :
                  parsedBusiness.business_type === 'professional' ? 'Professional Services' : 'Business Advertisement'}
               </span>
               {/* Edit button for owner */}
               {isOwner && onEditListing && (
                 <button
                   onClick={() => onEditListing(listing)}
                   className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                 >
                   ✏️ Edit?
                 </button>
               )}
             </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {parsedBusiness.business_name}
            </h2>
            <h3 className="text-lg font-semibold text-orange-600 mb-3">
              {parsedBusiness.headline}
            </h3>
          </div>
          
          {/* Featured Image */}
          {parsedBusiness.featured_image && (
            <div className="ml-6 flex-shrink-0">
              <img
                src={parsedBusiness.featured_image}
                alt="Business Logo/Featured Image"
                className="w-20 h-20 object-cover rounded-lg border-2 border-orange-200"
              />
            </div>
          )}
        </div>

        {/* Image Gallery */}
        {parsedBusiness.gallery_images.length > 1 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              🖼️ Business Gallery
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {parsedBusiness.gallery_images.slice(1).map((imageUrl: string, index: number) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Business image ${index + 2}`}
                  className="w-full h-20 object-cover rounded-lg border border-orange-100 hover:border-orange-300 transition-colors cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {parsedBusiness.description}
          </p>
        </div>

        {/* Restaurant Hours */}
        {parsedBusiness.business_type === 'restaurant' && hours && (
          <div className="mb-4">
            <div className="bg-white rounded-lg p-3 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                🕐 Hours of Operation
              </h4>
              <p className="text-sm text-gray-600">{hours}</p>
            </div>
          </div>
        )}

        {/* Service Business Features */}
        {parsedBusiness.business_type === 'service' && (
          <div className="mb-4">
            <div className="bg-white rounded-lg p-3 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                🔧 Services & Certifications
              </h4>
              <div className="flex flex-wrap gap-1">
                {parsedBusiness.description.toLowerCase().includes('licensed') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Licensed
                  </span>
                )}
                {parsedBusiness.description.toLowerCase().includes('insured') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Insured
                  </span>
                )}
                {parsedBusiness.description.toLowerCase().includes('24/7') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    24/7 Emergency
                  </span>
                )}
                {parsedBusiness.description.toLowerCase().includes('emergency') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Emergency Service
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Professional Services Features */}
        {parsedBusiness.business_type === 'professional' && (
          <div className="mb-4">
            <div className="bg-white rounded-lg p-3 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                🏆 Credentials & Experience
              </h4>
              <div className="flex flex-wrap gap-1">
                {parsedBusiness.description.includes('20') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    20+ Years Experience
                  </span>
                )}
                {parsedBusiness.description.toLowerCase().includes('certified') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Certified
                  </span>
                )}
                {parsedBusiness.description.toLowerCase().includes('maritime') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Maritime Law
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Special Offers */}
        {specialOffers.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              🎟️ Special Offers
            </h4>
            <div className="grid gap-3">
              {specialOffers.map((offer, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-green-800">Special Offer</h5>
                      <p className="text-lg font-bold text-green-600">{offer}</p>
                    </div>
                    <div className="ml-4">
                      <div className="w-16 h-16 bg-white border-2 border-green-300 rounded-lg flex items-center justify-center">
                        <div className="text-xs text-center text-green-600">
                          📱<br/>Call<br/>Now
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="border-t border-orange-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Details */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm">
                {contactInfo.phone && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📞</span>
                    <a href={`tel:${contactInfo.phone}`} className="hover:text-orange-600">
                      {contactInfo.phone}
                    </a>
                  </div>
                )}
                {contactInfo.address && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    {contactInfo.address}
                  </div>
                )}
                {contactInfo.website && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">🌐</span>
                    <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">
                      {contactInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
                >
                  📞 Call Now
                </a>
              )}
              
              {/* Restaurant Reservation */}
              {parsedBusiness.business_type === 'restaurant' && (
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  🍽️ Make Reservation
                </button>
              )}

              {/* Professional Consultation */}
              {parsedBusiness.business_type === 'professional' && (
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  ⚖️ Free Consultation
                </button>
              )}

              {contactInfo.website && (
                <a
                  href={contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors text-center"
                >
                  🌐 Visit Website
                </a>
              )}
              
              <button className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors">
                ✉️ Contact Business
              </button>
            </div>
          </div>
        </div>

        {/* Business Stats */}
        <div className="mt-6 pt-4 border-t border-orange-200">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              📅 Listed: {new Date(listing.created_at).toLocaleDateString()}
            </div>
            <div>
              👀 Views: {listing.clicks}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 