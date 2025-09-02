# 🚀 Vercel API Deployment Troubleshooting Guide

## 🔍 Current Issue
API routes (`/api/recipe` and `/api/test`) are not accessible after deployment to Vercel, returning 404 errors.

## ✅ Verified Configuration
- ✅ File structure is correct: `/api/recipe.ts` and `/api/test.ts`
- ✅ `vercel.json` is properly configured for TypeScript API routes
- ✅ API functions use correct Vercel types (`VercelRequest`, `VercelResponse`)
- ✅ CORS headers are properly set
- ✅ Export default async function pattern is correct

## 🛠️ Step-by-Step Troubleshooting

### Step 1: Check Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your `KIRANA-CORNER` project
3. Click on the project name
4. Navigate to **Functions** tab
5. **Look for**: `/api/recipe` and `/api/test` functions
6. **Expected**: Both functions should be listed with "Ready" status

### Step 2: Check Deployment Logs
1. In your project dashboard, go to **Deployments** tab
2. Click on the latest deployment
3. Look for any error messages during build
4. Check specifically for API function compilation errors

### Step 3: Force Redeploy
```bash
# Method 1: Through Dashboard
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes

# Method 2: Through CLI
vercel --prod --force
```

### Step 4: Test Endpoints
After redeployment, test in this order:

1. **Test endpoint first** (simpler):
   ```
   https://your-domain.vercel.app/api/test
   ```
   Expected: JSON response with "API is working perfectly!"

2. **Recipe endpoint**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/recipe \
     -H "Content-Type: application/json" \
     -d '{"query":"chicken curry"}'
   ```

## 🚨 Common Vercel Issues & Fixes

### Issue 1: Functions Not Listed in Dashboard
**Cause**: Build process didn't detect API files
**Fix**: 
- Ensure `vercel.json` is in root directory
- Check that `api/` folder is in root (not in `src/`)
- Redeploy with `--force` flag

### Issue 2: TypeScript Compilation Errors
**Cause**: Missing dependencies or type issues
**Fix**:
```bash
# Ensure @vercel/node is in dependencies (not devDependencies)
npm install @vercel/node --save
git add package.json package-lock.json
git commit -m "fix: move @vercel/node to dependencies"
git push origin master
```

### Issue 3: Environment Variables Missing
**Cause**: API might need environment variables
**Fix**: Check Vercel dashboard → Settings → Environment Variables

### Issue 4: Cold Start Issues
**Cause**: Serverless functions take time to wake up
**Fix**: Try the endpoint 2-3 times with 30-second intervals

## 🔧 Quick Fix Commands

### 1. Update Dependencies
```bash
# Ensure Vercel dependencies are correct
npm install @vercel/node --save
npm install vercel --save-dev
```

### 2. Clean Redeploy
```bash
# Clean deployment
rm -rf .vercel
vercel --prod
```

### 3. Local Testing
```bash
# Test locally first
npx vercel dev
# Then test: http://localhost:3000/api/test
```

## 📋 Checklist Before Asking for Help

- [ ] Functions appear in Vercel Dashboard → Functions tab
- [ ] No build errors in Deployment logs
- [ ] Tried force redeploy (waited 3+ minutes)
- [ ] Tested simple `/api/test` endpoint first
- [ ] Checked environment variables if any are needed
- [ ] Verified domain URL is correct

## 🆘 If Still Not Working

Provide these details:
1. **Vercel project URL**: https://your-domain.vercel.app
2. **Functions tab screenshot**: Do you see the API functions listed?
3. **Deployment logs**: Any red error messages?
4. **Test endpoint result**: What happens when you visit `/api/test`?
5. **Exact error message**: From browser console or curl

## 🎯 Most Likely Fix
Based on the symptoms, try this first:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click "Redeploy" on the latest deployment
3. Wait 3 minutes
4. Test `/api/test` endpoint
5. If that works, test `/api/recipe` with POST request

The issue is most likely a deployment cache or build process problem that a fresh deployment will resolve.
