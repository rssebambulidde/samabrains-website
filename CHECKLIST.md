# Authentication Error - Step-by-Step Checklist

Follow these steps **in order** to fix the authentication error:

## ✅ Step 1: Verify API Key in Brevo

1. Go to [Brevo Dashboard](https://app.brevo.com)
2. **Settings** → **SMTP & API** → **"API keys & MCP"** tab
3. Verify your API key exists and is **active**
4. Copy the **entire** API key (starts with `xkeysib-`)

## ✅ Step 2: Check Railway Variables

1. Go to Railway Dashboard → Your Project → **Variables**
2. Verify `BREVO_API_KEY` exists
3. Click on it and verify:
   - ✅ No spaces before or after the key
   - ✅ The entire key is there (not truncated)
   - ✅ Key starts with `xkeysib-`

## ✅ Step 3: REDEPLOY (CRITICAL!)

**This is the #1 cause of authentication errors!**

1. Railway Dashboard → Your Project
2. Click on your **service** (usually named "web")
3. Go to **Deployments** tab
4. Click **"Redeploy"** button (or "Deploy" if no recent deployment)
5. **Wait for deployment to complete** (2-3 minutes)

## ✅ Step 4: Check Railway Logs

After redeploying, check the logs:

1. Railway Dashboard → Your Project → **Logs** tab
2. Look for these messages:
   ```
   ✅ BREVO_API_KEY is set (xkeysib-...)
   ✅ CONTACT_EMAIL is set: info@samabrains.com
   ✅ Email integration is ready!
   ```
3. If you see errors, note them down

## ✅ Step 5: Check IP Authorization (If Still Failing)

Brevo may require IP authorization:

1. Go to [Brevo Dashboard](https://app.brevo.com)
2. **Settings** → **Security**
3. Look for **"Authorized IPs"** or **"IP Whitelist"**
4. Add Railway's IP addresses (or allow all IPs for testing)
5. **Note**: Railway IPs change, so you may need to allow all IPs

## ✅ Step 6: Test API Key Directly

Test if your API key works:

```bash
# Replace YOUR_API_KEY with your actual key
curl -X GET "https://api.brevo.com/v3/account" \
  -H "api-key: YOUR_API_KEY"
```

**Expected response**: Account information (JSON)
**If 401 error**: API key is invalid or IP not authorized

## ✅ Step 7: Verify Domain Authentication

Since Feb 2024, Brevo requires domain authentication:

1. Go to Brevo Dashboard → **Settings** → **Senders & IP**
2. Check if your domain is authenticated
3. If not, follow Brevo's domain authentication process

## Common Mistakes

❌ **Added variable but didn't redeploy** - Most common!
❌ **API key has extra spaces** - Check in Railway
❌ **Copied incomplete key** - Make sure you copied the entire key
❌ **Using SMTP credentials instead of API key** - Must use API key from "API keys & MCP" tab
❌ **IP not authorized** - Check Brevo security settings

## Still Not Working?

1. **Create a fresh API key** in Brevo
2. **Delete old variable** in Railway
3. **Add new variable** with fresh key
4. **Redeploy** service
5. **Check logs** for detailed errors
6. **Test form** again

## Quick Test

After redeploying, submit the form and check:
- ✅ Success message appears
- ✅ Email received in inbox
- ✅ No errors in Railway logs

If all steps are followed and it still fails, the issue might be:
- IP authorization required
- Domain authentication required
- Brevo account restrictions
