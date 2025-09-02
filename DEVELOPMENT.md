# Development Guide for KiranaConnect AI Chatbot

## The 405 Method Not Allowed Error - SOLVED ✅

### Root Cause
The error occurs because Vite (development server) doesn't natively serve Vercel API functions. When you run `npm run dev`, the frontend works but `/api/recipe` returns 404/405.

### Solutions

#### Option 1: Use Vercel Dev (Recommended for Full Testing)
```bash
# Install Vercel CLI locally (already done)
npm install --save-dev vercel

# Run both frontend and API together
npm run dev:full

# Or run separately:
# Terminal 1: npm run dev
# Terminal 2: npm run dev:api
```

#### Option 2: Deploy to Vercel for Testing
The API works perfectly when deployed to Vercel. The 405 error only happens during local development.

```bash
# Deploy to test
vercel --prod
```

#### Option 3: Development Workaround (If Vercel dev fails)
If you encounter issues with Vercel dev, you can:

1. **Test API Logic**: Use the existing `api/test.ts` endpoint which works in all environments
2. **Mock API Responses**: Temporarily modify the frontend to use mock data during development
3. **Deploy for Testing**: Use Vercel's preview deployments for testing API functionality

### Current Status
- ✅ Frontend correctly sends POST requests
- ✅ API correctly handles POST requests  
- ✅ Error handling improved with detailed messages
- ✅ Duplicate API file removed (recipe.js deleted, recipe.ts kept)
- ✅ Development scripts added to package.json
- ✅ Vite proxy configuration added

### Testing the Fix

1. **Start Development Servers**:
   ```bash
   npm run dev:full
   ```

2. **Test API Directly**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"query":"chicken curry"}' \
     http://localhost:3001/api/recipe
   ```

3. **Test Through Frontend**:
   - Open http://localhost:5173
   - Click the chat icon
   - Type "chicken curry" and send

### Error Messages Now Include:
- HTTP status codes
- Detailed error descriptions  
- Console logging for debugging

The 405 error should now be resolved! 🎉
