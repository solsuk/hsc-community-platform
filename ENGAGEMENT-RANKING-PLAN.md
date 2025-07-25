# 🎯 Engagement-Based Ranking System Plan
## HSC Platform Enhancement - Click Tracking & Smart Ranking

---

## 🎯 **SYSTEM OBJECTIVES**

### **Primary Goals:**
1. **📈 Boost Quality Content** - Popular listings get more visibility
2. **⚡ Improve User Experience** - More relevant content surfaces first  
3. **📊 Gather Analytics** - Understand community engagement patterns
4. **🔄 Create Feedback Loop** - Quality listings attract more clicks, get more exposure
5. **⏰ Maintain Freshness** - Prevent old content from dominating indefinitely

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **1. Click Tracking Infrastructure**

#### **A. Database Enhancements:**
```sql
-- Add engagement tracking columns to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS click_velocity DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS impression_count INTEGER DEFAULT 0;

-- Create listing_analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS listing_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'contact', 'share')),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User context (optional - for analytics)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    user_agent TEXT,
    referrer VARCHAR(500),
    
    -- Device/location data
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    ip_address INET,
    
    -- Engagement context
    time_on_listing INTEGER, -- seconds spent viewing
    scroll_depth INTEGER,    -- percentage scrolled in modal
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id ON listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_timestamp ON listing_analytics(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_listings_engagement_score ON listings(engagement_score DESC);
```

#### **B. API Endpoints:**

**Click Tracking API:**
```typescript
// POST /api/listings/[id]/track
interface TrackingRequest {
  event_type: 'view' | 'click' | 'contact' | 'share';
  session_id?: string;
  time_on_listing?: number;
  scroll_depth?: number;
}

interface TrackingResponse {
  success: boolean;
  new_click_count: number;
  engagement_score: number;
}
```

**Analytics API:**
```typescript
// GET /api/analytics/listings/[id]
interface ListingAnalytics {
  listing_id: string;
  total_clicks: number;
  total_impressions: number;
  click_through_rate: number;
  engagement_score: number;
  click_velocity: number;
  popular_hours: number[];
  device_breakdown: Record<string, number>;
  daily_clicks: Array<{date: string, clicks: number}>;
}
```

---

## 🧮 **ENGAGEMENT SCORING ALGORITHM**

### **Smart Ranking Formula:**
```typescript
interface EngagementFactors {
  clicks: number;
  impressions: number;
  age_hours: number;
  click_velocity: number; // clicks per hour in last 24h
  user_diversity: number; // unique users who clicked
  time_engagement: number; // avg time spent viewing
}

function calculateEngagementScore(factors: EngagementFactors): number {
  const {clicks, impressions, age_hours, click_velocity, user_diversity, time_engagement} = factors;
  
  // Base engagement (CTR + velocity)
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const base_engagement = (ctr * 100) + (click_velocity * 10);
  
  // Time decay factor (reduces influence as listing ages)
  const decay_factor = Math.exp(-age_hours / (48 * 24)); // 48-day half-life
  
  // Quality multipliers
  const diversity_bonus = Math.min(user_diversity / 10, 2.0); // Cap at 2x bonus
  const engagement_bonus = Math.min(time_engagement / 60, 1.5); // Cap at 1.5x for 60s+
  
  // Final score calculation
  const score = base_engagement * decay_factor * diversity_bonus * engagement_bonus;
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}
```

### **Ranking Priority System:**
```typescript
enum RankingTier {
  TRENDING = 'trending',      // High recent engagement
  POPULAR = 'popular',        // High total engagement
  FRESH = 'fresh',           // New with good initial response
  STANDARD = 'standard',     // Normal chronological
  DECLINING = 'declining'    // Losing engagement
}

function categorizeListings(listings: Listing[]): Record<RankingTier, Listing[]> {
  const now = new Date();
  
  return {
    trending: listings.filter(l => 
      l.click_velocity > 5 && 
      l.engagement_score > 50 && 
      getHoursSince(l.created_at) < 72
    ),
    popular: listings.filter(l => 
      l.engagement_score > 100 && 
      l.clicks > 20
    ),
    fresh: listings.filter(l => 
      getHoursSince(l.created_at) < 24 && 
      l.engagement_score > 20
    ),
    standard: listings.filter(l => 
      l.engagement_score >= 0 && 
      l.engagement_score <= 50
    ),
    declining: listings.filter(l => 
      l.click_velocity < 0.5 && 
      getHoursSince(l.created_at) > 168 // 1 week
    )
  };
}
```

---

## 🎨 **FRONTEND IMPLEMENTATION**

### **A. Enhanced Listing Tiles:**
```typescript
// Add visual indicators for engagement levels
interface ListingTileProps {
  listing: Listing;
  onListingClick: (listing: Listing) => void;
  onListingView: (listing: Listing) => void; // NEW: Track impressions
}

function ListingTile({listing, onListingClick, onListingView}: ListingTileProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tileRef = useRef(null);

  // Track when tile comes into view (impression tracking)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          onListingView(listing); // Track impression
        }
      },
      {threshold: 0.5}
    );

    if (tileRef.current) {
      observer.observe(tileRef.current);
    }

    return () => observer.disconnect();
  }, [listing.id, isVisible, onListingView]);

  const handleClick = () => {
    onListingClick(listing); // Track click + open modal
  };

  // Visual engagement indicators
  const getEngagementBadge = () => {
    if (listing.engagement_score > 100) return "🔥 Trending";
    if (listing.engagement_score > 50) return "⭐ Popular";
    if (listing.click_velocity > 5) return "📈 Rising";
    return null;
  };

  return (
    <div ref={tileRef} onClick={handleClick} className="listing-tile">
      {/* Existing tile content */}
      
      {/* NEW: Engagement badge */}
      {getEngagementBadge() && (
        <div className="engagement-badge">
          {getEngagementBadge()}
        </div>
      )}
      
      {/* NEW: Click counter for owner */}
      {isOwner && (
        <div className="engagement-stats">
          👀 {listing.clicks} • ⚡ {listing.engagement_score}
        </div>
      )}
    </div>
  );
}
```

### **B. Smart Sorting Implementation:**
```typescript
function SmartListingSorter({listings}: {listings: Listing[]}) {
  const [sortMode, setSortMode] = useState<'smart' | 'newest' | 'popular'>('smart');

  const sortListings = (listings: Listing[], mode: string): Listing[] => {
    switch (mode) {
      case 'smart':
        return smartEngagementSort(listings);
      case 'newest':
        return [...listings].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'popular':
        return [...listings].sort((a, b) => b.engagement_score - a.engagement_score);
      default:
        return listings;
    }
  };

  const smartEngagementSort = (listings: Listing[]): Listing[] => {
    const categorized = categorizeListings(listings);
    
    // Arrange by priority tiers
    return [
      ...categorized.trending.sort((a, b) => b.click_velocity - a.click_velocity),
      ...categorized.popular.sort((a, b) => b.engagement_score - a.engagement_score),
      ...categorized.fresh.sort((a, b) => b.engagement_score - a.engagement_score),
      ...categorized.standard.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      ...categorized.declining.sort((a, b) => b.engagement_score - a.engagement_score)
    ];
  };

  return (
    <div className="listing-sorter">
      <div className="sort-controls">
        <button onClick={() => setSortMode('smart')} 
                className={sortMode === 'smart' ? 'active' : ''}>
          🧠 Smart Ranking
        </button>
        <button onClick={() => setSortMode('newest')} 
                className={sortMode === 'newest' ? 'active' : ''}>
          🕒 Newest First
        </button>
        <button onClick={() => setSortMode('popular')} 
                className={sortMode === 'popular' ? 'active' : ''}>
          🔥 Most Popular
        </button>
      </div>
      
      <ListingGrid 
        listings={sortListings(listings, sortMode)}
        onListingClick={trackClickAndOpenModal}
        onListingView={trackImpression}
      />
    </div>
  );
}
```

---

## 📈 **ANALYTICS DASHBOARD**

### **A. Listing Owner Analytics:**
```typescript
interface ListingAnalyticsDashboard {
  listing: Listing;
  analytics: ListingAnalytics;
}

function ListingAnalyticsDashboard({listing, analytics}: ListingAnalyticsDashboard) {
  return (
    <div className="analytics-dashboard">
      <h3>📊 {listing.title} - Performance</h3>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Total Views" 
          value={analytics.total_impressions}
          trend={analytics.impression_trend}
        />
        <MetricCard 
          title="Clicks" 
          value={analytics.total_clicks}
          trend={analytics.click_trend}
        />
        <MetricCard 
          title="Click Rate" 
          value={`${analytics.click_through_rate}%`}
          trend={analytics.ctr_trend}
        />
        <MetricCard 
          title="Engagement Score" 
          value={analytics.engagement_score}
          trend={analytics.score_trend}
        />
      </div>

      <div className="charts-section">
        <ClickChart dailyClicks={analytics.daily_clicks} />
        <DeviceBreakdown devices={analytics.device_breakdown} />
        <PopularHours hours={analytics.popular_hours} />
      </div>

      <div className="insights-section">
        <h4>💡 Insights & Recommendations</h4>
        <EngagementInsights analytics={analytics} />
      </div>
    </div>
  );
}
```

### **B. Community-Wide Analytics:**
```typescript
interface CommunityAnalytics {
  total_listings: number;
  total_engagement: number;
  trending_categories: Array<{category: string, growth: number}>;
  peak_hours: number[];
  engagement_leaderboard: Listing[];
}

function CommunityAnalyticsDashboard({analytics}: {analytics: CommunityAnalytics}) {
  return (
    <div className="community-analytics">
      <h2>🏘️ Community Engagement Overview</h2>
      
      <div className="community-metrics">
        <div className="metric">
          <h3>Active Listings</h3>
          <p className="value">{analytics.total_listings}</p>
        </div>
        <div className="metric">
          <h3>Total Engagement</h3>
          <p className="value">{analytics.total_engagement}</p>
        </div>
      </div>

      <div className="trending-section">
        <h3>📈 Trending Categories</h3>
        {analytics.trending_categories.map(cat => (
          <div key={cat.category} className="trend-item">
            <span>{cat.category}</span>
            <span className="growth">+{cat.growth}%</span>
          </div>
        ))}
      </div>

      <div className="leaderboard">
        <h3>🏆 Most Engaging Listings</h3>
        {analytics.engagement_leaderboard.slice(0, 10).map((listing, index) => (
          <div key={listing.id} className="leaderboard-item">
            <span className="rank">#{index + 1}</span>
            <span className="title">{listing.title}</span>
            <span className="score">{listing.engagement_score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation (Week 1-2)**
- [ ] **Database migrations** - Add engagement tracking columns
- [ ] **Click tracking API** - POST /api/listings/[id]/track
- [ ] **Basic frontend tracking** - Implement click/impression tracking
- [ ] **Update listing display** - Show engagement scores to owners

### **Phase 2: Smart Ranking (Week 3-4)**
- [ ] **Engagement algorithm** - Implement scoring formula
- [ ] **Smart sorting** - Update main page sorting logic
- [ ] **Visual indicators** - Add engagement badges to tiles
- [ ] **Sort controls** - Let users choose between smart/newest/popular

### **Phase 3: Analytics Dashboard (Week 5-6)**
- [ ] **Owner analytics** - Individual listing performance dashboards
- [ ] **Community insights** - Platform-wide engagement overview
- [ ] **Recommendations** - Smart suggestions for improving engagement
- [ ] **A/B testing framework** - Test different ranking algorithms

### **Phase 4: Advanced Features (Week 7-8)**
- [ ] **Real-time updates** - Live engagement score updates
- [ ] **Engagement notifications** - Alert owners when listings are trending
- [ ] **Seasonal adjustments** - Account for time-of-year engagement patterns
- [ ] **Machine learning** - Implement predictive engagement scoring

---

## 📊 **SUCCESS METRICS**

### **User Engagement:**
- **Click-through rate improvement** - Target 25%+ increase
- **Time on site increase** - More engaged browsing
- **Return user rate** - Better content discovery

### **Content Quality:**
- **High-quality content rises** - Better listings get more visibility
- **Reduced spam/low-quality** - Poor content naturally sinks
- **More user interactions** - Increased contacts between buyers/sellers

### **Business Impact:**
- **Increased ad revenue** - Better performing listings = higher ad competition
- **Community growth** - More engaging platform attracts more users
- **User satisfaction** - More relevant content improves experience

---

## 🔒 **PRIVACY & ETHICAL CONSIDERATIONS**

### **Data Privacy:**
- **Anonymous tracking option** - Users can opt out of detailed analytics
- **GDPR compliance** - Proper consent and data handling
- **IP address anonymization** - Hash IPs for privacy protection

### **Fair Ranking:**
- **Anti-gaming measures** - Prevent artificial click inflation
- **Diversity factors** - Ensure new listings get fair chance
- **Category balance** - Prevent single categories from dominating

### **Transparency:**
- **Algorithm explanation** - Help users understand ranking factors  
- **Owner insights** - Clear analytics to help improve listings
- **Community guidelines** - Best practices for creating engaging content

---

**🎯 NEXT STEP: Ready to begin Phase 1 implementation with click tracking infrastructure?** 