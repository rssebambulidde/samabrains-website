// Railway Function / Serverless Function for Brevo Email Integration
// This file handles the server-side email sending using Brevo API

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  // Extract form data
  const { name, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false,
      message: 'All fields are required' 
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

  // Get environment variables
  const brevoApiKey = process.env.BREVO_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL || 'info@samabrains.com';

  if (!brevoApiKey) {
    console.error('BREVO_API_KEY environment variable is not set');
    return res.status(500).json({ 
      success: false,
      message: 'Server configuration error. Please contact the administrator.' 
    });
  }

  try {
    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: name,
          email: email
        },
        to: [
          {
            email: contactEmail,
            name: 'SamaBrains Solutions'
          }
        ],
        replyTo: {
          email: email,
          name: name
        },
        subject: `New Contact Form Submission from ${name}`,
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', data);
      
      // Handle specific Brevo error codes
      if (response.status === 401) {
        return res.status(500).json({ 
          success: false,
          message: 'Authentication failed. Please check API key configuration.' 
        });
      }
      
      if (response.status === 402) {
        return res.status(500).json({ 
          success: false,
          message: 'Email quota exceeded. Please try again later.' 
        });
      }

      return res.status(500).json({ 
        success: false,
        message: 'Failed to send email. Please try again later.' 
      });
    }

    // Success
    return res.status(200).json({ 
      success: true,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while sending the email. Please try again later.' 
    });
  }
}

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
