// Express server for Brevo email integration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load dotenv for local development (optional in production)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available - that's okay for production
}

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware - helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS - restrict to specific origins
const allowedOrigins = [
  'https://samabrains.com',
  'https://www.samabrains.com',
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (!isProduction) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// Rate limiting for email endpoint
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.static('.')); // Serve static files

// Email endpoint with rate limiting
app.post('/api/send-email', emailLimiter, async (req, res) => {
  const { name, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false,
      message: 'All fields are required' 
    });
  }

  // Length validation
  if (name.length > 100 || email.length > 100 || message.length > 5000) {
    return res.status(400).json({ 
      success: false,
      message: 'Input too long' 
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid email address' 
    });
  }

  // Get and trim API key (remove any whitespace)
  let brevoApiKey = process.env.BREVO_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL || 'info@samabrains.com';

  if (!brevoApiKey) {
    console.error('BREVO_API_KEY environment variable is not set');
    return res.status(500).json({ 
      success: false,
      message: 'Server configuration error' 
    });
  }

  // Trim whitespace from API key (common issue)
  brevoApiKey = brevoApiKey.trim();

  // Only log in development
  if (!isProduction) {
    console.log('Brevo API Key present:', !!brevoApiKey);
  }

  try {
    // Send the email
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: 'SamaBrains Solutions',
          email: contactEmail
        },
        to: [{
          email: contactEmail,
          name: 'SamaBrains Solutions'
        }],
        replyTo: {
          email: email,
          name: name
        },
        subject: 'Contact SamaBrains',
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #ff6b35; }
                .message-box { background: white; padding: 15px; border-left: 4px solid #ff6b35; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>New Contact Form Submission</h2>
                </div>
                <div class="content">
                  <div class="field">
                    <span class="label">Name:</span> ${escapeHtml(name)}
                  </div>
                  <div class="field">
                    <span class="label">Email:</span> ${escapeHtml(email)}
                  </div>
                  <div class="field">
                    <span class="label">Message:</span>
                    <div class="message-box">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
        textContent: `
          New Contact Form Submission
          
          Name: ${name}
          Email: ${email}
          
          Message:
          ${message}
        `
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error('Brevo API non-JSON response:', text);
      data = { message: text };
    }

    if (!response.ok) {
      console.error('Brevo API error:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (response.status === 401) {
        let errorMessage = 'Authentication failed. ';
        
        if (data.message && data.message.includes('unrecognised IP address')) {
          errorMessage += 'IP address not authorized in Brevo. Please contact the administrator.';
        } else {
          errorMessage += 'Please contact the administrator.';
        }
        
        return res.status(500).json({ 
          success: false,
          message: errorMessage
        });
      }
      
      if (response.status === 402) {
        return res.status(500).json({ 
          success: false,
          message: 'Email service temporarily unavailable. Please try again later.' 
        });
      }

      if (response.status === 400) {
        return res.status(500).json({ 
          success: false,
          message: 'Invalid request. Please check your input.' 
        });
      }

      return res.status(500).json({ 
        success: false,
        message: 'Failed to send email. Please try again later.' 
      });
    }

    res.json({ 
      success: true,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred. Please try again later.' 
    });
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Serve index.html for all other routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  
  // Check environment variables (minimal logging)
  const brevoKey = process.env.BREVO_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;
  
  if (brevoKey) {
    console.log('BREVO_API_KEY: configured');
  } else {
    console.log('BREVO_API_KEY: NOT SET - emails will not work!');
  }
  
  if (contactEmail) {
    console.log(`CONTACT_EMAIL: ${contactEmail}`);
  } else {
    console.log('CONTACT_EMAIL: using default (info@samabrains.com)');
  }
});
