# API Key vs SMTP Credentials - What You Need

## Quick Answer

For your contact form integration, you **ONLY need the API Key**. You do **NOT need** SMTP credentials.

## The Difference

### API Key (What You Need) ✅
- Used for **REST API** integration (what we set up)
- Found in: **Settings → SMTP & API → "API keys & MCP" tab**
- Looks like: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Simple to use - just one key
- Works with our Express server setup

### SMTP Credentials (What You DON'T Need) ❌
- Used for **SMTP protocol** (like email clients)
- Found in: **Settings → SMTP & API → "SMTP" tab**
- Includes: SMTP server, port, login, password
- More complex setup
- Not needed for our current integration

## Where to Find Your API Key

1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Click **Settings** (gear icon, usually top right)
3. Click **SMTP & API**
4. **Click the "API keys & MCP" tab** (NOT the "SMTP" tab)
5. You'll see your API keys here
6. Copy the entire key

## Visual Guide

```
Brevo Dashboard
  └── Settings
      └── SMTP & API
          ├── [SMTP] tab ← Don't use this (shows SMTP server, port, login)
          └── [API keys & MCP] tab ← Use this! (shows your API keys)
```

## Why We Use API Key Instead of SMTP

1. **Simpler**: Only one credential (API key) vs multiple (server, port, login, password)
2. **More secure**: API keys can be scoped and revoked easily
3. **Better for web apps**: REST API is designed for programmatic access
4. **Easier integration**: Works directly with our Express server
5. **Better error handling**: API returns structured JSON responses

## If You Already Have SMTP Credentials

If you only have SMTP credentials and want to use them instead, we would need to:
1. Change the server code to use SMTP (nodemailer library)
2. Configure SMTP connection settings
3. Handle SMTP authentication differently

However, **using the API key is recommended** because:
- It's simpler
- It's what we've already set up
- It's more suitable for web applications
- It provides better error messages

## Summary

- ✅ **Use**: API Key from "API keys & MCP" tab
- ❌ **Don't use**: SMTP credentials from "SMTP" tab
- 📍 **Location**: Settings → SMTP & API → "API keys & MCP" tab
- 🔑 **Format**: Long string starting with `xkeysib-...`
