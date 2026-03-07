// Express server for Brevo email integration and Contentful Proxy
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const NodeCache = require('node-cache');

// Load dotenv for local development (optional in production)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available - that's okay for production
}

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min TTL

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
  'https://samabrains-website.pages.dev', // Cloudflare Pages Main Branch target
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if the origin matches our exact allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Dynamically allow any Cloudflare Pages preview subdomain ending in .pages.dev
    // This securely matches things like https://development.samabrains-website.pages.dev
    if (origin && origin.endsWith('.pages.dev')) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (!isProduction) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
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

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

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

// --- Contentful Integration ---

app.get('/api/posts', async (req, res) => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const previewToken = process.env.CONTENTFUL_PREVIEW_TOKEN;

  const usePreview = req.query.preview === 'true';
  const token = usePreview && previewToken ? previewToken : accessToken;
  const host = usePreview && previewToken ? 'preview.contentful.com' : 'cdn.contentful.com';

  if (!spaceId || !token) {
    return res.status(500).json({ error: 'Contentful credentials not configured' });
  }

  const cacheKey = `posts_${usePreview ? 'preview' : 'live'}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(`https://${host}/spaces/${spaceId}/environments/master/entries?content_type=blogPost&order=-fields.date`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Contentful API returned ${response.status}`);
    }

    const data = await response.json();
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching from Contentful:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/api/posts/:slug', async (req, res) => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const previewToken = process.env.CONTENTFUL_PREVIEW_TOKEN;
  const slug = req.params.slug;

  const usePreview = req.query.preview === 'true';
  const token = usePreview && previewToken ? previewToken : accessToken;
  const host = usePreview && previewToken ? 'preview.contentful.com' : 'cdn.contentful.com';

  if (!spaceId || !token) {
    return res.status(500).json({ error: 'Contentful credentials not configured' });
  }

  const cacheKey = `post_${slug}_${usePreview ? 'preview' : 'live'}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Query Contentful specifically for an entry with this matching slug
    const response = await fetch(`https://${host}/spaces/${spaceId}/environments/master/entries?content_type=blogPost&fields.slug=${slug}&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Contentful API returned ${response.status}`);
    }

    const data = await response.json();

    // Check if a post was actually found
    if (data.items && data.items.length > 0) {
      cache.set(cacheKey, data);
      res.json(data);
    } else {
      res.status(404).json({ error: 'Post not found' });
    }

  } catch (error) {
    console.error('Error fetching post from Contentful:', error);
    res.status(500).json({ error: 'Failed to fetch the post' });
  }
});

// --- Blog page with SSR OG meta tags (for social media crawlers) ---

let cachedTemplate = null;
let templateFetchedAt = 0;
const TEMPLATE_TTL = 60 * 60 * 1000; // 1 hour

async function getPostTemplate() {
  const now = Date.now();
  if (cachedTemplate && (now - templateFetchedAt) < TEMPLATE_TTL) {
    return cachedTemplate;
  }
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://samabrains.com';
    const resp = await fetch(`${frontendUrl}/post.html`);
    if (resp.ok) {
      cachedTemplate = await resp.text();
      templateFetchedAt = now;
      return cachedTemplate;
    }
  } catch (e) {
    console.error('Failed to fetch post.html template:', e.message);
  }
  return cachedTemplate; // Return stale cache if fetch failed
}

app.get('/api/blog-page/:slug', async (req, res) => {
  const slug = req.params.slug;
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  // Get the HTML template
  let html = await getPostTemplate();
  if (!html) {
    return res.redirect(`/post.html?id=${slug}`);
  }

  // Fetch post data (reuse cache)
  if (spaceId && accessToken) {
    const cacheKey = `post_${slug}_live`;
    let data = cache.get(cacheKey);

    if (!data) {
      try {
        const response = await fetch(`https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?content_type=blogPost&fields.slug=${slug}&limit=1`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          data = await response.json();
          if (data.items && data.items.length > 0) {
            cache.set(cacheKey, data);
          }
        }
      } catch (e) {
        console.error('OG tag fetch error:', e.message);
      }
    }

    // Inject OG meta tags
    if (data && data.items && data.items.length > 0) {
      const fields = data.items[0].fields;
      const title = escapeHtml(fields.title || fields.tittle || 'Article');
      const description = escapeHtml(fields.excerpt || title);
      const postUrl = `https://samabrains.com/blog/${slug}`;

      let imageUrl = 'https://samabrains.com/assets/og-image.jpg';
      if (fields.coverImage && fields.coverImage.sys && data.includes && data.includes.Asset) {
        const asset = data.includes.Asset.find(a => a.sys.id === fields.coverImage.sys.id);
        if (asset && asset.fields && asset.fields.file && asset.fields.file.url) {
          imageUrl = `https:${asset.fields.file.url}`;
        }
      }

      html = html.replace(/<title>.*?<\/title>/, `<title>${title} | SamaBrains Blog</title>`);
      html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);
      html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`);
      html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${description}">`);
      html = html.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${imageUrl}">`);
      html = html.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${postUrl}">`);
      html = html.replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${title}">`);
      html = html.replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${description}">`);
      html = html.replace(/<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${imageUrl}">`);
    }
  }

  res.set('Content-Type', 'text/html');
  res.send(html);
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

  if (process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_ACCESS_TOKEN) {
    console.log('CONTENTFUL: configured for Production');
  } else {
    console.log('CONTENTFUL: NOT SET - Blog will not load data!');
  }

  if (process.env.CONTENTFUL_PREVIEW_TOKEN) {
    console.log('CONTENTFUL: Preview API configured');
  }
});
