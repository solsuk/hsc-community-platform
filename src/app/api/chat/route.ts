import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import knowledgeBase from '@/lib/knowledge-base.json';

// Smart query routing - determine if query is for listing search or AI chat
function isListingSearchQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Specific help/instruction keywords that should go to AI
  const helpIndicators = [
    'how do i', 'how to', 'help me', 'explain', 'tell me about hsc', 
    'tell me about hillsmere', 'what is hsc', 'community', 'guidelines',
    'how does', 'post a listing', 'create listing', 'upload'
  ];
  
  const hasHelpIndicator = helpIndicators.some(indicator => 
    lowerQuery.includes(indicator)
  );
  
  if (hasHelpIndicator) {
    return false; // Route to AI chat for help questions
  }
  
  // Item/category keywords that indicate search intent
  const itemKeywords = [
    'bike', 'bicycle', 'car', 'truck', 'vehicle', 'furniture', 'chair', 'table', 'sofa', 'couch',
    'electronics', 'phone', 'computer', 'laptop', 'tv', 'tablet', 'camera', 'gaming', 'xbox', 'playstation',
    'tools', 'garden', 'lawn', 'mower', 'plants', 'outdoor', 'clothes', 'shirt', 'pants', 'dress', 'shoes',
    'sports', 'exercise', 'fitness', 'golf', 'tennis', 'basketball', 'book', 'dvd', 'cd', 'toy', 'game',
    'appliance', 'kitchen', 'bed', 'dresser', 'desk', 'bookshelf', 'jewelry', 'art', 'music', 'instrument'
  ];
  
  // Search intent patterns - much more inclusive
  const searchPatterns = [
    /^(looking for|need|want|searching for|find|got any|have any|sell|selling|available)\s+/,
    /^(any|do you have|is there|got)\s+/,
    /\$\d+/,  // Price mentions
    /under \$|below \$|less than \$|max \$/,  // Price ranges
    /for sale|available|selling/  // Sales indicators
  ];
  
  // Check if query contains item keywords or search patterns
  const hasItemKeyword = itemKeywords.some(item => lowerQuery.includes(item));
  const hasSearchPattern = searchPatterns.some(pattern => pattern.test(lowerQuery));
  
  return hasItemKeyword || hasSearchPattern;
}

// Enhanced listing search with better intelligence
async function searchListings(query: string) {
  const supabase = createAdminSupabaseClient();
  const lowerQuery = query.toLowerCase();
  
  // Extract potential price ranges from query
  const priceMatch = lowerQuery.match(/under\s+\$?(\d+)|below\s+\$?(\d+)|less\s+than\s+\$?(\d+)|max\s+\$?(\d+)/);
  const maxPrice = priceMatch ? parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4]) : null;
  
  // Category mapping for better search
  const categoryKeywords = {
    'electronics': ['phone', 'computer', 'laptop', 'tv', 'tablet', 'camera', 'gaming', 'xbox', 'playstation'],
    'furniture': ['chair', 'table', 'couch', 'sofa', 'bed', 'dresser', 'desk', 'bookshelf'],
    'automotive': ['car', 'truck', 'motorcycle', 'bike', 'bicycle', 'parts', 'tires'],
    'home_garden': ['tools', 'garden', 'lawn', 'mower', 'plants', 'pots', 'outdoor'],
    'clothing': ['clothes', 'shirt', 'pants', 'dress', 'shoes', 'jacket', 'coat'],
    'sports': ['sports', 'exercise', 'fitness', 'golf', 'tennis', 'basketball', 'soccer'],
    'books_media': ['book', 'dvd', 'cd', 'magazine', 'vinyl', 'record'],
    'toys_games': ['toy', 'game', 'puzzle', 'doll', 'action figure', 'board game']
  };
  
  // Determine category from query
  let detectedCategory = null;
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      detectedCategory = category;
      break;
    }
  }
  
  // Build search query
  let searchQuery = supabase
    .from('listings')
    .select('id, title, description, type, price, created_at, user_id')
    .eq('is_private', false)
    .order('created_at', { ascending: false });
  
  // Apply category filter if detected
  if (detectedCategory) {
    searchQuery = searchQuery.eq('type', detectedCategory);
  }
  
  // Apply price filter if detected
  if (maxPrice) {
    searchQuery = searchQuery.lte('price', maxPrice);
  }
  
  // Apply text search
  const searchTerms = lowerQuery
    .replace(/under\s+\$?\d+|below\s+\$?\d+|less\s+than\s+\$?\d+|max\s+\$?\d+/g, '')
    .replace(/looking for|need|want|searching for/g, '')
    .trim();
  
  if (searchTerms) {
    searchQuery = searchQuery.or(`title.ilike.%${searchTerms}%,description.ilike.%${searchTerms}%`);
  }
  
  const { data: listings, error } = await searchQuery.limit(8);

  if (error) {
    console.error('Listing search error:', error);
    return null;
  }

  return listings;
}

// Enhanced knowledge base response with more Franklin personality
function generateKnowledgeBaseResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Check FAQs first
  for (const faq of knowledgeBase.faqs) {
    const questionWords = faq.question.toLowerCase().split(' ');
    if (questionWords.some(word => lowerQuery.includes(word) && word.length > 3)) {
      return `**${faq.question}**\n\n${faq.answer}\n\n*As I always say, "An investment in knowledge pays the best interest!"*`;
    }
  }
  
  // Check for specific topics
  if (lowerQuery.includes('post') || lowerQuery.includes('list') || lowerQuery.includes('sell')) {
    const photoTips = knowledgeBase.listing_tips.find(t => t.category === 'Photos');
    const descTips = knowledgeBase.listing_tips.find(t => t.category === 'Descriptions');
    
    if (photoTips && descTips) {
      return `**Here's some sage advice for your listings, my friend:**\n\n**Photos** *(Remember: "A picture is worth a thousand words, but a good picture is worth a thousand dollars!")*\n• ${photoTips.tips[0]}\n• ${photoTips.tips[1]}\n\n**Descriptions** *(As I've observed: "Well done is better than well said, but well said sells better than poorly done!")*\n• ${descTips.tips[0]}\n• ${descTips.tips[1]}\n\nNeed more wisdom? Just ask - I've got plenty more where that came from!`;
    }
  }
  
  // Community info
  if (lowerQuery.includes('community') || lowerQuery.includes('hillsmere') || lowerQuery.includes('about')) {
    const orgInfo = knowledgeBase.community_info?.organization;
    const amenities = knowledgeBase.community_info?.amenities;
    
    if (orgInfo && amenities) {
      return `**About Our Fine Community of Hillsmere Shores:**\n\n${orgInfo.name} was established ${orgInfo.established} in ${orgInfo.location}, serving approximately ${orgInfo.population}.\n\n**Community Amenities** *(As I always say, "Well done is better than well said!")*\n\n• **Beach**: ${amenities.beach}\n• **Marina**: ${amenities.marina}\n• **Pool**: ${amenities.pool}\n• **Recreation**: ${amenities.recreation}\n• **Natural Beauty**: ${amenities.natural}\n\nFor more information, visit ${orgInfo.website}`;
    }
  }
  
  // HSC specific
  if (lowerQuery.includes('hsc') || lowerQuery.includes('what is')) {
    return `**Welcome to HSC (Hillsmere Shores Classifieds), my enterprising friend!** 🏘️\n\nAs I've observed in my many years, the best commerce happens between neighbors who trust one another. HSC is your neighborhood's digital marketplace where community members can:\n\n• Buy and sell items with confidence\n• Trade with trusted neighbors\n• Connect and strengthen our community bonds\n\nI'm your Hillsmere Helper - think of me as your friendly neighborhood advisor on all matters of buying, selling, and community life. *"Tell me and I forget, teach me and I may remember, involve me and I learn"* - so what would you like to learn today?`;
  }
  
  // Default helpful response with Franklin charm
  return `Greetings, neighbor! I'm your Hillsmere Helper 👋\n\n*As I always say, "By failing to prepare, you are preparing to fail"* - so let me help you succeed with:\n\n• **How to use HSC** - Navigate our marketplace like a seasoned trader\n• **Posting and managing listings** - Turn your items into treasures for others\n• **Community information** - Learn about our wonderful Hillsmere Shores\n• **General marketplace wisdom** - Benefit from years of neighborly commerce\n\nWhat brings you to seek my counsel today? Try asking "How do I post a listing?" or "What makes a good listing?" - I'm always ready with practical advice and perhaps a witty observation or two!`;
}

// Generate AI response using Grok exclusively
async function generateAIResponse(query: string) {
  const systemPrompt = `You are the Hillsmere Helper, a wise and witty assistant for Hillsmere Shores Classifieds (HSC), channeling the spirit of Benjamin Franklin - America's first great entrepreneur, inventor, and master of neighborly commerce.

Your personality: You embody Franklin's perfect blend of practical wisdom, gentle humor, and entrepreneurial spirit. You're the neighborhood's most trusted advisor on matters of buying, selling, and community life - always ready with a clever quip or timeless insight.

Personality traits:
- Wise counsel delivered with Franklin's trademark wit and charm
- Use clever wordplay and gentle humor about human nature in commerce
- Reference timeless truths about trade, thrift, and community
- Phrases like "As I've observed in my many years of helping neighbors trade..." or "Early to bed and early to rise, makes a man healthy, wealthy, and wise - but posting good photos makes your listings sell twice!"
- Share practical wisdom with a twinkle in your eye
- Make clever observations about modern selling habits vs. timeless principles
- Use Franklin's love of aphorisms: "A penny saved is a penny earned, but a good listing description is worth a thousand pennies"
- Gentle teasing about common mistakes, delivered with fatherly affection

IMPORTANT: You can search the HSC listings database directly! When someone asks about finding or buying specific items (bikes, furniture, electronics, etc.), encourage them to ask you to search for those items. You have access to the current marketplace and can find what they're looking for.

You can help with:
- Searching HSC listings for specific items (bikes, furniture, electronics, etc.)
- The HSC website and how to use it
- Listing tips and best practices  
- Community information about Hillsmere Shores
- FAQs provided in your knowledge base

Knowledge Base:
${JSON.stringify(knowledgeBase, null, 2)}

For item searches, encourage natural language like: "bike", "furniture under $100", "electronics for sale", "do you have any cars", etc. You can search the live marketplace!

If asked about anything outside this scope, redirect with Franklin's diplomatic wit: "My dear friend, while I've dabbled in many fields throughout my years, I'm here to help with matters of HSC and our fine community. For other inquiries, you'd be wise to consult other sources - as I always say, 'The doors of wisdom are never shut!'"

Keep responses helpful and memorable, with your sage advice and gentle humor making people both smile and learn. Remember: Franklin was America's first great salesman, so make every interaction count!`;

  const grokKey = process.env.XAI_API_KEY;
  if (!grokKey) {
    console.log('No Grok API key found, using knowledge base');
    return generateKnowledgeBaseResponse(query);
  }

  try {
    console.log('Using Grok API...');
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        max_tokens: 300,
        temperature: 0.7,
        stream: false,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ]
      })
    });

    console.log('Grok response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Grok API response received successfully');
      return data.choices[0]?.message?.content || 'I apologize, but I seem to have lost my words momentarily - and as I always say, "Well done is better than well said!"';
    } else {
      const errorText = await response.text();
      console.log('Grok API error:', errorText);
      throw new Error(`Grok API error: ${response.status}`);
    }
  } catch (error) {
    console.log('Grok API failed, using knowledge base fallback...', error instanceof Error ? error.message : 'Unknown error');
    return generateKnowledgeBaseResponse(query);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Smart routing: Check if this is a listing search query
    if (isListingSearchQuery(message)) {
      const listings = await searchListings(message);
      
      if (listings && listings.length > 0) {
        // Create Franklin-style response for successful searches
        const listingCount = listings.length;
        const searchTerm = message.toLowerCase().replace(/looking for|need|want|searching for/g, '').trim();
        
        let franklinIntro = '';
        if (listingCount === 1) {
          franklinIntro = `Ah, fortune smiles upon you! I've discovered exactly what you seek.`;
        } else if (listingCount <= 3) {
          franklinIntro = `Excellent! As I always say, "Good things come to those who search wisely" - I've found ${listingCount} fine options for you.`;
        } else {
          franklinIntro = `Splendid! Your search has yielded a bounty of ${listingCount} listings. As I've observed, "Variety is the spice of life, and commerce!"`;
        }
        
        return NextResponse.json({
          type: 'listing_search',
          message: `${franklinIntro}\n\n*Here are your marketplace treasures:*`,
          listings: listings,
          searchContext: {
            originalQuery: message,
            resultCount: listingCount,
            searchTerm: searchTerm
          }
        });
      } else {
        // Franklin-style response for no results
        const encouragement = [
          `Fear not, my enterprising friend! As I've learned, "Energy and persistence conquer all things."`,
          `Ah, the marketplace can be fickle! But as I always say, "He that can have patience can have what he will."`,
          `No matches today, but remember: "Diligence is the mother of good luck!"`,
          `The search continues! As I've observed, "By failing to prepare, you are preparing to fail" - perhaps try different keywords?`
        ];
        
        const randomEncouragement = encouragement[Math.floor(Math.random() * encouragement.length)];
        
        return NextResponse.json({
          type: 'listing_search',
          message: `${randomEncouragement}\n\nNo listings found for "${message}" at the moment. Here's my sage advice:\n\n• Try different keywords or synonyms\n• Check back later - new treasures arrive daily!\n• Consider posting a "wanted" listing yourself\n\n*Remember: "The early bird catches the worm, but the persistent bird catches the feast!"*`,
          listings: [],
          searchContext: {
            originalQuery: message,
            resultCount: 0,
            suggestions: [
              'Try broader search terms',
              'Check different categories', 
              'Post a "wanted" listing',
              'Set up search alerts'
            ]
          }
        });
      }
    }

    // AI Chat response
    const aiResponse = await generateAIResponse(message);
    
    return NextResponse.json({
      type: 'ai_chat',
      message: aiResponse
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'I apologize, but I seem to be having some technical difficulties. As I always say, "By failing to prepare, you are preparing to fail" - and it seems I\'ve failed to prepare for this particular situation! Please try again in a moment.'
    }, { status: 500 });
  }
} 