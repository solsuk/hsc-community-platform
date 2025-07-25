# Grok API Setup Guide

## 🚀 Quick Setup for Grok AI Integration

Your HSC chatbot now uses **Grok** (by xAI) instead of Anthropic Claude. Grok offers:
- ✅ **Better pricing** ($0.30/M vs $15/M for input tokens)
- ✅ **Free tier available** with usage quotas
- ✅ **Real-time web access** (unlike Claude)
- ✅ **OpenAI-compatible API** (easy integration)

## Step 1: Get Your Free Grok API Key

1. **Visit**: https://console.x.ai/
2. **Sign up** with your email (no credit card required for free tier)
3. **Get $25 in free credits** (as of 2024)
4. **Copy your API key** from the dashboard

## Step 2: Add API Key to Your Project

1. **Update your `.env.local` file**:
   ```bash
   # Replace the old Anthropic key with:
   XAI_API_KEY=your-actual-grok-api-key-here
   ```

2. **Remove the old Anthropic key line** (if it exists):
   ```bash
   # Delete this line:
   # ANTHROPIC_API_KEY=sk-ant-api...
   ```

## Step 3: Test Your Setup

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the chatbot**:
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What is HSC?"}'
   ```

## Expected Response

You should see a response like:
```json
{
  "type": "ai_chat",
  "message": "Welcome to HSC (Hillsmere Shores Classifieds)! 🏘️\n\nHSC is your neighborhood's online classifieds board..."
}
```

## Pricing Comparison

| Provider | Input (per 1M tokens) | Output (per 1M tokens) | Free Tier | Currently Used |
|----------|----------------------|------------------------|-----------|----------------|
| **Grok Mini** | $0.30 | $0.50 | ✅ $25 credits | ❌ |
| **Grok Fast** | $1.50 | $7.50 | ✅ $25 credits | ✅ **Active** |
| **Grok Standard** | $3.00 | $15.00 | ✅ $25 credits | ❌ |
| Anthropic Claude | $3.00 | $15.00 | ❌ Credits required | ❌ |

**Note**: We're using `grok-3-fast` for the best balance of cost, speed, and reliability. The mini version had some compatibility issues with our complex system prompts.

## Troubleshooting

### "XAI_API_KEY not found"
- Make sure you added the key to `.env.local`
- Restart your development server
- Check for typos in the variable name

### "API error: 401"
- Verify your API key is correct
- Check if you have remaining credits at https://console.x.ai/

### "API error: 429"
- You've hit the rate limit
- Wait a few minutes or upgrade your plan

## Features Available

✅ **Smart Query Routing** - Automatically routes between AI chat and listing search  
✅ **Knowledge Base Fallback** - Works even without API credits  
✅ **Hillsmere Helper Personality** - Friendly with dry humor  
✅ **Real-time Responses** - Faster than Claude in most cases  

## Next Steps

Once your API key is working:
1. **Test different questions** to see Grok's personality
2. **Monitor usage** at https://console.x.ai/
3. **Consider upgrading** if you need higher limits
4. **Deploy to production** when ready

## Support

- **Grok Documentation**: https://docs.x.ai/
- **xAI Support**: https://console.x.ai/support
- **Community**: https://x.com/xai (Twitter/X)

---

**Ready to test?** Add your API key and restart the server! 🎉 