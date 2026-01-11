# Fix: IP Address Authorization Error

## The Problem

Your logs show this error:
```
"We have detected you are using an unrecognised IP address 208.77.244.74"
```

**This means**: Your API key is correct, but Brevo is blocking requests from Railway's server because the IP address isn't authorized.

## The Solution

You need to authorize Railway's IP addresses in Brevo:

### Step 1: Go to Brevo Security Settings

1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Click **Settings** (gear icon)
3. Click **Security** (or go directly to: https://app.brevo.com/security/authorised_ips)

### Step 2: Authorize IP Addresses

You have two options:

#### Option A: Allow All IPs (Easiest for Testing)

1. In the "Authorized IPs" section
2. Look for an option to **"Allow all IPs"** or **"Disable IP restriction"**
3. Enable it
4. Save

**Note**: This is less secure but works for testing. Railway IPs can change, so this is the easiest solution.

#### Option B: Add Specific IPs (More Secure)

1. In the "Authorized IPs" section
2. Click **"Add IP"** or **"Authorize IP"**
3. Add the IP address: `208.77.244.74` (from your logs)
4. **Note**: Railway IPs can change, so you may need to add multiple IPs or use Option A

### Step 3: Test Again

After authorizing the IP:

1. Go back to your website
2. Submit the contact form
3. It should work now! ✅

## Why This Happens

Brevo has IP whitelisting as a security feature. When you make API requests from a new IP address (like Railway's servers), Brevo blocks them until you authorize that IP.

## Railway IP Addresses

Railway uses dynamic IP addresses that can change. The current IP from your logs is:
- `208.77.244.74`

But this may change in the future. That's why **Option A (Allow All IPs)** is recommended for production use with Railway.

## After Fixing

Once you've authorized the IP:

1. ✅ The form should work immediately
2. ✅ You'll receive emails in your inbox
3. ✅ No more authentication errors

## Still Having Issues?

If you've authorized the IP but still get errors:

1. **Wait a few minutes** - IP authorization can take a moment to propagate
2. **Check Brevo dashboard** - Verify the IP is actually saved
3. **Try "Allow all IPs"** - This ensures it works regardless of Railway IP changes
4. **Check Railway logs** - Look for any new error messages

---

**Quick Link**: https://app.brevo.com/security/authorised_ips
