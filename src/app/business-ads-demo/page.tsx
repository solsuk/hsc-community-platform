'use client';

import { useState } from 'react';

export default function BusinessAdsDemo() {
  const [selectedDemo, setSelectedDemo] = useState(0);

  const demoAds = [
    {
      id: 'tonys-pizza',
      business_name: "Tony's Hillsmere Pizza",
      business_type: 'Restaurant/Food Service',
      headline: '🍕 Authentic NY-Style Pizza Since 1987!',
      description: 'Family-owned pizzeria serving fresh, hand-tossed pizza with locally sourced ingredients. Try our famous "Chesapeake Special" with crab and Old Bay seasoning!',
      featured_image: '/images/pizza.png',
      gallery_images: [
        '/images/pizza.png',
        '/images/pizza.png', // Would be different images in real implementation
      ],
      contact_methods: {
        phone: '(410) 555-TONY',
        email: 'orders@tonyspizza-hsc.com',
        website: 'www.tonyshillsmerepizza.com',
        address: '123 Bay Ridge Ave, Hillsmere Shores, MD',
        social_media: {
          facebook: 'TonysHillsmerePizza',
          instagram: 'tonys_pizza_hsc'
        }
      },
      hours: {
        monday: { open: '11:00 AM', close: '10:00 PM', closed: false },
        tuesday: { open: '11:00 AM', close: '10:00 PM', closed: false },
        wednesday: { open: '11:00 AM', close: '10:00 PM', closed: false },
        thursday: { open: '11:00 AM', close: '10:00 PM', closed: false },
        friday: { open: '11:00 AM', close: '11:00 PM', closed: false },
        saturday: { open: '11:00 AM', close: '11:00 PM', closed: false },
        sunday: { open: '12:00 PM', close: '9:00 PM', closed: false }
      },
      dietary_options: ['Vegetarian', 'Gluten-Free Options'],
      delivery_options: ['Dine-In', 'Takeout', 'DoorDash', 'Local Delivery'],
      coupons: [
        {
          id: 'welcome-pizza',
          title: 'New Customer Special',
          description: 'Get 20% off your first order',
          discount_text: '20% OFF First Order',
          expiration_date: '2025-08-31'
        }
      ],
      call_to_action: 'Order Now',
      reservation_platform: 'Call Ahead'
    },
    {
      id: 'bay-plumbing',
      business_name: 'Bay Area Plumbing & Heating',
      business_type: 'Service Business',
      headline: '🔧 24/7 Emergency Service - Licensed & Insured',
      description: 'Professional plumbing and HVAC services for Hillsmere Shores residents. Over 15 years serving the community with honest pricing and quality work.',
      featured_image: '/images/saw.png', // Placeholder - would be plumber logo
      contact_methods: {
        phone: '(410) 555-PIPE',
        email: 'service@bayplumbing-md.com',
        website: 'www.bayareaplumbing.com',
        address: 'Serving All of Hillsmere Shores',
        social_media: {
          facebook: 'BayAreaPlumbingMD'
        }
      },
      service_areas: ['Hillsmere Shores', 'Bay Ridge', 'Annapolis'],
      certifications: ['Licensed', 'Bonded', 'Insured', 'Master Plumber'],
      services: ['Emergency Repairs', 'Water Heaters', 'HVAC Service', 'Drain Cleaning'],
      call_to_action: 'Call for Free Estimate',
      coupons: [
        {
          id: 'plumbing-discount',
          title: 'Senior Discount',
          description: '$50 off any service call for seniors 65+',
          discount_text: '$50 OFF Senior Discount',
          expiration_date: '2025-12-31'
        }
      ]
    },
    {
      id: 'shores-boutique',
      business_name: 'Shores Style Boutique',
      business_type: 'Retail/Shopping',
      headline: '👗 Coastal Fashion & Unique Gifts',
      description: 'Curated collection of coastal-inspired clothing, jewelry, and home decor. Supporting local artisans and sustainable fashion choices.',
      contact_methods: {
        phone: '(410) 555-STYLE',
        email: 'hello@shoresstyle.com',
        website: 'www.shoresstyle.com',
        address: '456 Hillsmere Dr, Hillsmere Shores, MD',
        social_media: {
          instagram: 'shores_style_boutique',
          facebook: 'ShoresStyleBoutique'
        }
      },
      hours: {
        monday: { open: '10:00 AM', close: '6:00 PM', closed: false },
        tuesday: { open: '10:00 AM', close: '6:00 PM', closed: false },
        wednesday: { open: '10:00 AM', close: '6:00 PM', closed: false },
        thursday: { open: '10:00 AM', close: '7:00 PM', closed: false },
        friday: { open: '10:00 AM', close: '7:00 PM', closed: false },
        saturday: { open: '10:00 AM', close: '6:00 PM', closed: false },
        sunday: { open: '12:00 PM', close: '5:00 PM', closed: false }
      },
      product_categories: ['Women\'s Clothing', 'Jewelry', 'Home Decor', 'Gifts'],
      call_to_action: 'Visit Our Store',
      coupons: [
        {
          id: 'boutique-spring',
          title: 'Spring Collection',
          description: '15% off all spring arrivals',
          discount_text: '15% OFF Spring Items',
          expiration_date: '2025-09-15'
        }
      ]
    },
    {
      id: 'maritime-law',
      business_name: 'Chesapeake Maritime Law',
      business_type: 'Professional Services',
      headline: '⚖️ Experienced Maritime & Real Estate Attorney',
      description: 'Specializing in waterfront property law, boat accidents, and maritime disputes. Serving Hillsmere Shores and Chesapeake Bay communities for over 20 years.',
      contact_methods: {
        phone: '(410) 555-LEGAL',
        email: 'info@chesapeakemaritimelaw.com',
        website: 'www.chesapeakemaritimelaw.com',
        address: '789 Harborview Rd, Suite 200, Annapolis, MD',
        social_media: {
          linkedin: 'chesapeake-maritime-law'
        }
      },
      credentials: ['JD Maritime Law', 'MD Bar Certified', 'Admiralty Law Specialist'],
      practice_areas: ['Maritime Law', 'Real Estate', 'Property Disputes', 'Boat Accidents'],
      call_to_action: 'Free Consultation',
      consultation_booking: true
    }
  ];

  const renderBusinessAd = (ad: any) => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-6 shadow-lg">
        {/* Business Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
                             <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                 Ad
               </span>
              <span className="text-sm text-gray-500">
                {ad.business_type}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {ad.business_name}
            </h2>
            <h3 className="text-lg font-semibold text-orange-600 mb-3">
              {ad.headline}
            </h3>
          </div>
          
          {/* Featured Image */}
          {ad.featured_image && (
            <div className="ml-6 flex-shrink-0">
              <img
                src={ad.featured_image}
                alt="Business Logo"
                className="w-20 h-20 object-cover rounded-lg border-2 border-orange-200"
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {ad.description}
          </p>
        </div>

        {/* Restaurant Features */}
        {ad.business_type === 'Restaurant/Food Service' && (
          <div className="space-y-3 mb-4">
            {/* Hours */}
            {ad.hours && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🕐 Hours of Operation
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(ad.hours).slice(0, 4).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize font-medium">{day}:</span>
                      <span className="text-gray-600">
                        {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Options */}
            {ad.dietary_options && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🥗 Dietary Options
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ad.dietary_options.map((option: string) => (
                    <span key={option} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service Options */}
            {ad.delivery_options && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🚚 Service Options
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ad.delivery_options.map((option: string) => (
                    <span key={option} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Business Features */}
        {ad.business_type === 'Service Business' && (
          <div className="space-y-3 mb-4">
            {ad.services && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🔧 Services Offered
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ad.services.map((service: string) => (
                    <span key={service} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ad.certifications && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  ✅ Certifications
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ad.certifications.map((cert: string) => (
                    <span key={cert} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Professional Services Features */}
        {ad.business_type === 'Professional Services' && (
          <div className="space-y-3 mb-4">
            {ad.practice_areas && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  📚 Practice Areas
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ad.practice_areas.map((area: string) => (
                    <span key={area} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ad.credentials && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🏆 Credentials
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ad.credentials.map((cred: string) => (
                    <span key={cred} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {cred}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Retail Features */}
        {ad.business_type === 'Retail/Shopping' && (
          <div className="space-y-3 mb-4">
            {ad.product_categories && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🛍️ Product Categories
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ad.product_categories.map((category: string) => (
                    <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ad.hours && (
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🕐 Store Hours
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(ad.hours).slice(0, 4).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize font-medium">{day}:</span>
                      <span className="text-gray-600">
                        {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR Coupons */}
        {ad.coupons && ad.coupons.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              🎟️ Special Offers
            </h4>
            <div className="grid gap-3">
              {ad.coupons.map((coupon: any) => (
                <div key={coupon.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-green-800">{coupon.title}</h5>
                      <p className="text-sm text-green-700 mb-1">{coupon.description}</p>
                      <p className="text-lg font-bold text-green-600">{coupon.discount_text}</p>
                      {coupon.expiration_date && (
                        <p className="text-xs text-green-600">
                          Expires: {new Date(coupon.expiration_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="w-16 h-16 bg-white border-2 border-green-300 rounded-lg flex items-center justify-center">
                        <div className="text-xs text-center text-green-600">
                          📱<br/>QR<br/>Code
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
                {ad.contact_methods.phone && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📞</span>
                    {ad.contact_methods.phone}
                  </div>
                )}
                {ad.contact_methods.email && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">✉️</span>
                    {ad.contact_methods.email}
                  </div>
                )}
                {ad.contact_methods.address && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    {ad.contact_methods.address}
                  </div>
                )}
                {ad.contact_methods.website && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">🌐</span>
                    {ad.contact_methods.website}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {ad.call_to_action && (
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  {ad.call_to_action}
                </button>
              )}
              
              {/* Reservation Button for Restaurants */}
              {ad.business_type === 'Restaurant/Food Service' && (
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Make Reservation
                </button>
              )}

              {/* Consultation Button for Professional Services */}
              {ad.consultation_booking && (
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Schedule Consultation
                </button>
              )}
              
              <button className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors">
                Contact Business
              </button>
            </div>
          </div>

          {/* Social Media */}
          {(ad.contact_methods.social_media?.facebook || 
            ad.contact_methods.social_media?.instagram || 
            ad.contact_methods.social_media?.linkedin) && (
            <div className="mt-3 pt-3 border-t border-orange-100">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Follow Us</h5>
              <div className="flex space-x-3">
                {ad.contact_methods.social_media.facebook && (
                  <span className="text-blue-600">📘 Facebook</span>
                )}
                {ad.contact_methods.social_media.instagram && (
                  <span className="text-pink-600">📷 Instagram</span>
                )}
                {ad.contact_methods.social_media.linkedin && (
                  <span className="text-blue-500">💼 LinkedIn</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Business Advertisement Showcase
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              See how your business could be featured on Hillsmere Shores Classifieds
            </p>
            <div className="flex justify-center">
              <a
                href="/"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                ← Back to HSC
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Selection */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            Choose a Business Type to Preview
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {demoAds.map((ad, index) => (
              <button
                key={ad.id}
                onClick={() => setSelectedDemo(index)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDemo === index
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {ad.business_name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Demo Ad */}
        <div className="mb-8">
          {renderBusinessAd(demoAds[selectedDemo])}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Create Your Business Advertisement?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Join hundreds of local businesses reaching customers in Hillsmere Shores
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Start Advertising Today
            </a>
            <a
              href="/"
              className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Targeted Reach</h4>
            <p className="text-gray-600">Reach local customers in your immediate community</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Affordable Pricing</h4>
            <p className="text-gray-600">Starting at just $5/week with competitive market pricing</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">📱</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Interactive Features</h4>
            <p className="text-gray-600">QR coupons, reservation links, and direct contact options</p>
          </div>
        </div>
      </div>
    </div>
  );
} 