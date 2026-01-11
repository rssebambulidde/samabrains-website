# Brevo Authentication Troubleshooting

If you're getting an "Authentication failed" error, follow these steps:

## Step 1: Verify API Key in Railway

1. Go to Railway Dashboard → Your Project → Variables
2. Check that `BREVO_API_KEY` exists and is set
3. Make sure there are **no extra spaces** before or after the key
4. The key should be a long alphanumeric string (typically 40+ characters)

## Step 2: Get a Fresh API Key from Brevo

1. Log in to [Brevo Dashboard](https://app.brevo.com)
2. Go to **Settings** → **API Keys**
3. If you see an existing key, you can:
   - **Copy it again** (make sure you copy the entire key)
   - **Create a new key** (delete the old one and create a new one)
4. Copy the **entire** API key (it's long!)

## Step 3: Update Railway Environment Variable

1. In Railway Dashboard → Variables
2. Click on `BREVO_API_KEY`
3. **Delete the old value completely**
4. **Paste the new key** (make sure you paste the entire key)
5. Save the variable
6. **Redeploy** your service (Railway should auto-redeploy)

## Step 4: Verify API Key Format

Brevo API keys should:
- Be 40+ characters long
- Contain alphanumeric characters
- Look something like: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 5: Check Railway Logs

After redeploying, check Railway logs for:
- `✅ BREVO_API_KEY is set (xkeysib-...)` - This confirms the key is loaded
- Any error messages about authentication

## Step 6: Test API Key Directly

You can test your API key using curl:

```bash
curl -X GET "https://api.brevo.com/v3/account" \
  -H "api-key: YOUR_API_KEY_HERE"
```

If the key is valid, you'll get account information. If invalid, you'll get a 401 error.

## Common Issues

### Issue: "Authentication failed" error

**Possible causes:**
1. API key is incorrect or incomplete
2. API key has extra spaces
3. API key was copied incorrectly
4. API key was revoked in Brevo dashboard

**Solution:**
- Get a fresh API key from Brevo
- Delete and re-add the variable in Railway
- Make sure no spaces are included

### Issue: API key seems correct but still fails

**Possible causes:**
1. The variable wasn't saved properly in Railway
2. The service needs to be redeployed
3. The API key doesn't have the right permissions

**Solution:**
- Double-check the variable is saved in Railway
- Trigger a manual redeploy
- Verify the API key has "Send emails" permission in Brevo

### Issue: Variable not found in logs

**Possible causes:**
1. Variable name is misspelled (must be exactly `BREVO_API_KEY`)
2. Variable wasn't saved
3. Service needs redeploy

**Solution:**
- Check the exact variable name (case-sensitive)
- Save the variable again
- Redeploy the service

## Quick Checklist

- [ ] API key copied from Brevo dashboard (Settings → API Keys)
- [ ] Entire key copied (not truncated)
- [ ] No spaces before or after the key
- [ ] Variable name is exactly `BREVO_API_KEY` (case-sensitive)
- [ ] Variable saved in Railway
- [ ] Service redeployed after adding variable
- [ ] Logs show `✅ BREVO_API_KEY is set`
- [ ] API key is 40+ characters long

## Still Not Working?

1. **Create a new API key** in Brevo (delete the old one first)
2. **Update Railway variable** with the new key
3. **Redeploy** the service
4. **Check logs** for any errors
5. **Test the form** again

If it still doesn't work, check:
- Brevo account status (is it active?)
- Brevo account email verification
- Railway service logs for detailed error messages
