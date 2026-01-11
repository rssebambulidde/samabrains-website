# Brevo (Sendinblue) Setup Instructions

The contact form is configured to use Brevo (formerly Sendinblue) for sending emails. Follow these steps to set it up.

## Prerequisites

1. **Brevo Account**: Sign up at [https://www.brevo.com](https://www.brevo.com)
2. **API Key**: Get your Brevo API key from the dashboard

## Setup Steps

### Step 1: Get Your Brevo API Key

1. Log in to your Brevo account
2. Go to **Settings** → **API Keys**
3. Create a new API key or copy an existing one
4. **Important**: Keep this key secure and never expose it in client-side code

### Step 2: Configure Your Backend/Serverless Function

Since Brevo's API requires server-side calls for security, you need to create a backend endpoint. Choose one of the following options:

#### Option A: Railway Functions (Recommended for Railway deployment)

1. Create a new file `api/send-email.js` in your project:

```javascript
// api/send-email.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY // Set this in Railway environment variables
      },
      body: JSON.stringify({
        sender: {
          name: name,
          email: email
        },
        to: [
          {
            email: process.env.CONTACT_EMAIL || 'info@samabrains.com', // Your email
            name: 'SamaBrains Solutions'
          }
        ],
        subject: `New Contact Form Submission from ${name}`,
        htmlContent: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
        textContent: `
          New Contact Form Submission
          
          Name: ${name}
          Email: ${email}
          Message: ${message}
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', data);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send email. Please try again later.' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred. Please try again later.' 
    });
  }
}
```

2. **Set Environment Variables in Railway**:
   - `BREVO_API_KEY`: Your Brevo API key
   - `CONTACT_EMAIL`: The email address where you want to receive form submissions (e.g., info@samabrains.com)

#### Option B: Node.js Express Backend (Included)

1. A ready-to-use Express server is included in `server.js`. Simply:

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the project root:
```
BREVO_API_KEY=your_brevo_api_key_here
CONTACT_EMAIL=info@samabrains.com
```

#### Option C: Python Flask Backend

```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

@app.route('/api/send-email', methods=['POST'])
def send_email():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    
    if not all([name, email, message]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    brevo_url = 'https://api.brevo.com/v3/smtp/email'
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': os.environ.get('BREVO_API_KEY')
    }
    
    payload = {
        'sender': {
            'name': name,
            'email': email
        },
        'to': [{
            'email': os.environ.get('CONTACT_EMAIL', 'info@samabrains.com'),
            'name': 'SamaBrains Solutions'
        }],
        'subject': f'New Contact Form Submission from {name}',
        'htmlContent': f'''
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Message:</strong></p>
            <p>{message.replace(chr(10), "<br>")}</p>
        '''
    }
    
    try:
        response = requests.post(brevo_url, json=payload, headers=headers)
        if response.status_code == 201:
            return jsonify({'success': True, 'message': 'Email sent successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to send email'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=int(os.environ.get('PORT', 3000)))
```

### Step 3: Update the Frontend Endpoint

Update the endpoint URL in `script.js` to match your deployment:

```javascript
// Change this line in script.js
const endpoint = '/api/send-email'; // For same domain
// OR
const endpoint = 'https://your-backend-url.com/api/send-email'; // For different domain
```

### Step 4: Test the Form

1. Fill out and submit the contact form on your website
2. Check your email inbox (the one set in `CONTACT_EMAIL`)
3. Check Brevo dashboard for email logs

## Brevo Free Tier Limits

- **300 emails/day** on the free tier
- Perfect for contact forms and small websites
- Upgrade if you need more volume

## Security Notes

1. **Never expose your API key** in client-side JavaScript
2. Always use environment variables for sensitive data
3. Consider adding rate limiting to prevent abuse
4. Validate and sanitize all form inputs on the server side

## Troubleshooting

### Emails not sending

1. Check your Brevo API key is correct
2. Verify environment variables are set correctly
3. Check server logs for error messages
4. Ensure your Brevo account is verified
5. Check Brevo dashboard for any account restrictions

### CORS Errors

If you get CORS errors, make sure your backend has CORS enabled and allows requests from your website domain.

## Alternative: Direct Brevo Form (No Backend)

If you prefer not to set up a backend, Brevo also offers a form builder that you can embed. However, this requires using Brevo's hosted form solution.

---

**Need Help?** Check Brevo's API documentation: [https://developers.brevo.com](https://developers.brevo.com)
