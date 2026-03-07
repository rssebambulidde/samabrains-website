/**
 * Cloudflare Pages Function for /blog/:slug
 *
 * Handles clean URLs and injects server-side OG meta tags
 * so social media crawlers (LinkedIn, Twitter, WhatsApp) can
 * read the post title, description, and image from the raw HTML.
 */

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function onRequest(context) {
  const slug = context.params.slug;
  if (!slug) {
    return context.env.ASSETS.fetch(context.request);
  }

  // Backend URL from environment (same var used by build.js)
  const backendUrl = context.env.VITE_BACKEND_URL || 'https://samabrains-website-production.up.railway.app';

  // Fetch the static post.html template
  const assetUrl = new URL('/post.html', context.request.url);
  const assetResponse = await context.env.ASSETS.fetch(assetUrl);
  let html = await assetResponse.text();

  try {
    // Fetch post data from the backend API
    const apiResponse = await fetch(`${backendUrl}/api/posts/${slug}`);

    if (apiResponse.ok) {
      const data = await apiResponse.json();

      if (data.items && data.items.length > 0) {
        const post = data.items[0];
        const fields = post.fields;

        const title = fields.title || fields.tittle || 'Article';
        const description = fields.excerpt || title;
        const tags = fields.tags || [];
        const postUrl = `https://samabrains.com/blog/${slug}`;

        // Resolve cover image URL from includes
        let imageUrl = 'https://samabrains.com/assets/og-image.jpg';
        if (fields.coverImage?.sys?.id && data.includes?.Asset) {
          const asset = data.includes.Asset.find(a => a.sys.id === fields.coverImage.sys.id);
          if (asset?.fields?.file?.url) {
            imageUrl = `https:${asset.fields.file.url}`;
          }
        }

        // Auto-generate hashtags from tags
        const hashtags = tags.map(t => t.replace(/[^a-zA-Z0-9]/g, '')).join(',');

        // Inject real meta tags into HTML (replacing empty placeholders)
        html = html.replace(/<title>.*?<\/title>/, `<title>${escapeAttr(title)} | SamaBrains Blog</title>`);
        html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${escapeAttr(description)}">`);
        html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${escapeAttr(title)}">`);
        html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${escapeAttr(description)}">`);
        html = html.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${imageUrl}">`);
        html = html.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${postUrl}">`);
        html = html.replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${escapeAttr(title)}">`);
        html = html.replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${escapeAttr(description)}">`);
        html = html.replace(/<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${imageUrl}">`);

        // Add keywords meta if tags exist
        if (tags.length > 0) {
          html = html.replace('</head>', `    <meta name="keywords" content="${escapeAttr(tags.join(', '))}">\n</head>`);
        }
      }
    }
  } catch (err) {
    // If backend fetch fails, serve the page without SSR meta — JS will still render the post
    console.error('SSR meta tag injection failed:', err);
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}
