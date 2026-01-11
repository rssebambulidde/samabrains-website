# Testing Your Brevo Email Integration

After adding the environment variables in Railway, follow these steps to test your contact form.

## ✅ Verification Checklist

### 1. Environment Variables Set in Railway

Make sure you've added these in Railway Dashboard → Your Project → Variables:

- ✅ `BREVO_API_KEY` - Your Brevo API key
- ✅ `CONTACT_EMAIL` - The email where you want to receive form submissions (e.g., `info@samabrains.com`)

### 2. Verify Deployment

1. **Check Railway Logs**:
   - Go to Railway Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check the logs for: `Server running on port 3000`
   - You should see: `Make sure BREVO_API_KEY and CONTACT_EMAIL are set in environment variables`

2. **Check Your Website**:
   - Visit your deployed website
   - The contact form should be visible and functional

### 3. Test the Contact Form

1. **Fill out the form**:
   - Name: Your name
   - Email: Your email address
   - Message: Test message

2. **Submit the form**:
   - Click "Send Message"
   - You should see "Sending..." on the button
   - Wait for the success notification

3. **Check for success**:
   - ✅ Success: You'll see a green notification: "Message sent successfully! I'll get back to you soon."
   - ❌ Error: You'll see a red notification with an error message

### 4. Verify Email Delivery

1. **Check your inbox**:
   - Check the email address you set in `CONTACT_EMAIL`
   - You should receive an email with the form submission
   - The email will have a nice HTML format with your branding

2. **Check Brevo Dashboard**:
   - Log in to [Brevo Dashboard](https://app.brevo.com)
   - Go to **Transactional** → **Emails**
   - You should see the sent email in the logs

## 🔍 Troubleshooting

### Form shows "Network error"

**Possible causes:**
- The server isn't running
- The endpoint URL is incorrect
- CORS issues

**Solutions:**
1. Check Railway logs for errors
2. Verify the endpoint in `script.js` is `/api/send-email`
3. Check that `server.js` is being used (check Railway logs)

### Form shows "Server configuration error"

**Possible causes:**
- `BREVO_API_KEY` environment variable is not set
- The variable name is misspelled

**Solutions:**
1. Double-check the variable name in Railway (must be exactly `BREVO_API_KEY`)
2. Make sure there are no extra spaces
3. Redeploy after adding the variable

### Form shows "Authentication failed"

**Possible causes:**
- Invalid Brevo API key
- API key doesn't have proper permissions

**Solutions:**
1. Verify your API key in Brevo dashboard
2. Make sure you copied the entire key (no truncation)
3. Check that your Brevo account is active

### Form shows "Email quota exceeded"

**Possible causes:**
- You've reached Brevo's daily limit (300 emails/day on free tier)

**Solutions:**
1. Wait until the next day
2. Upgrade your Brevo plan if needed
3. Check Brevo dashboard for usage statistics

### No email received

**Possible causes:**
- Email went to spam
- Wrong email address in `CONTACT_EMAIL`
- Brevo account not verified

**Solutions:**
1. Check your spam/junk folder
2. Verify `CONTACT_EMAIL` is correct in Railway
3. Verify your Brevo account email address
4. Check Brevo dashboard for email logs

## 🧪 Manual API Test

You can test the API endpoint directly using curl:

```bash
curl -X POST https://your-railway-app.up.railway.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message"
  }'
```

Expected response on success:
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

## 📊 Monitoring

### Railway Logs
- Check Railway Dashboard → Your Project → Logs
- Look for any error messages
- Check for successful API calls to Brevo

### Brevo Dashboard
- Go to **Transactional** → **Emails**
- View sent emails and their status
- Check for any bounces or failures

## ✅ Success Indicators

Your setup is working correctly if:

1. ✅ Form submission shows success notification
2. ✅ Email is received in your inbox
3. ✅ Email appears in Brevo dashboard
4. ✅ No errors in Railway logs
5. ✅ Server logs show successful API calls

---

**Need more help?** Check the `BREVO_SETUP.md` file for detailed setup instructions.
