/**
 * Blog Logic for Headless CMS integration (Contentful)
 * 
 * This file pulls data from your Express backend, which in turn
 * fetches the live data securely from Contentful.
 */

// --- Application Logic ---

// window.BACKEND_URL is set by config.js, which is generated at build time by build.js.
// Falls back to localhost when running locally without the Cloudflare build step.
const API_BASE_URL = (window.BACKEND_URL && window.BACKEND_URL !== '')
    ? window.BACKEND_URL
    : 'http://localhost:3000';

async function initBlog() {
    const isBlogFeed = document.getElementById('blog-grid');
    const isSinglePost = document.getElementById('post-content');

    if (isBlogFeed) {
        const posts = await fetchPostsFromCMS();
        renderBlogFeed(posts);
    }

    if (isSinglePost) {
        // Get post ID (slug) from URL
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('id'); // Using 'id' param for slug here to match previous HTML

        if (slug) {
            const result = await fetchSinglePostFromCMS(slug);
            renderSinglePost(result);
        } else {
            renderSinglePost(null); // Will render the "Not Found" state
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}

/**
 * Fetches all blog posts from the backend proxy
 */
async function fetchPostsFromCMS() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Returns the full Contentful response object

    } catch (error) {
        console.error("Error fetching posts:", error);
        return { items: [] };
    }
}

/**
 * Fetches a single post by its slug from the backend
 */
async function fetchSinglePostFromCMS(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${slug}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Return the first matched item along with includes (for resolving images)
        if (data.items && data.items.length > 0) {
            return { post: data.items[0], includes: data.includes };
        }
        return null;

    } catch (error) {
        console.error("Error fetching single post:", error);
        return null;
    }
}

/**
 * Helper function to extract a resolved image URL from Contentful's linked assets
 */
function getImageUrl(assetId, includes) {
    if (!includes || !includes.Asset) return 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&q=80'; // Default fallback

    const asset = includes.Asset.find(a => a.sys.id === assetId);
    if (asset && asset.fields && asset.fields.file) {
        return `https:${asset.fields.file.url}`;
    }
    return 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&q=80';
}

function renderBlogFeed(posts) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Contentful returns an array of items in `posts.items`
    const items = posts.items || [];

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
                <p>No posts available yet. Check back soon!</p>
            </div>
        `;
        return;
    }

    items.forEach((post, index) => {
        const fields = post.fields;
        if (!fields) return;

        // Safely extract data with fallbacks
        const title = fields.title || fields.tittle || 'Untitled Post';
        const slug = fields.slug || '';
        const excerpt = fields.excerpt || 'Read more about this topic...';

        // Format date string
        let formattedDate = 'Recent';
        if (fields.date) {
            const d = new Date(fields.date);
            formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        // Extract Image
        let imageUrl = getImageUrl(fields.coverImage?.sys?.id, posts.includes);

        const card = document.createElement('a');
        card.href = `post.html?id=${slug}`; // Passing the slug as the 'id' param for the next page
        card.className = "group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 card-hover fade-in";
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="relative h-56 overflow-hidden bg-gray-100">
                <img src="${imageUrl}" alt="${title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&q=80'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="p-6">
                <div class="flex items-center text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
                    <span>${formattedDate}</span>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">${title}</h3>
                <p class="text-gray-600 text-sm line-clamp-3 mb-6">${excerpt}</p>
                <div class="flex items-center text-orange-600 font-semibold text-sm">
                    Read Article <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderSinglePost(result) {
    const container = document.getElementById('post-content');
    if (!container) return;

    const postData = result ? result.post : null;
    const includes = result ? result.includes : null;

    if (!postData || !postData.fields) {
        container.innerHTML = `
            <div class="text-center py-20 fade-in">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-exclamation text-2xl text-gray-400"></i>
                </div>
                <h1 class="text-3xl font-bold mb-4 text-gray-900">Article not found</h1>
                <p class="text-gray-600 mb-8 max-w-md mx-auto">We couldn't find the article you're looking for. It might have been removed or the link is incorrect.</p>
                <a href="blog.html" class="hero-gradient text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                    <i class="fas fa-home"></i> Return to Blog
                </a>
            </div>
        `;
        return;
    }

    const fields = postData.fields;

    // Safely extract data
    const title = fields.title || fields.tittle || 'Untitled Post';
    const author = fields.author || 'SamaBrains Team';

    // Quick rendering of Contentful Rich Text.
    // For production, you should use the official @contentful/rich-text-html-renderer library on the backend
    // to securely parse this instead of stringifying here. But this will work for simple text blocks for now.
    let htmlContent = '<p>No content available.</p>';
    if (fields.content && fields.content.content) {
        // A very basic parser for Contentful's Rich Text AST to HTML
        htmlContent = fields.content.content.map(node => {
            if (node.nodeType === 'paragraph') {
                const text = node.content.map(n => n.value).join('');
                return `<p>${text}</p>`;
            }
            if (node.nodeType === 'heading-2') {
                const text = node.content.map(n => n.value).join('');
                return `<h2>${text}</h2>`;
            }
            return ''; // Ignore other types for this simple implementation
        }).join('');
    }

    // Format date string
    let formattedDate = 'Recent';
    if (fields.date) {
        const d = new Date(fields.date);
        formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Resolve cover image from Contentful includes
    const imageUrl = getImageUrl(fields.coverImage?.sys?.id, includes);

    // Set page title for SEO
    document.title = `${title} | SamaBrains Blog`;

    // Render the article
    container.innerHTML = `
        <article class="fade-in">
            <header class="mb-10 text-center">
                <div class="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold tracking-wider mb-6">
                    Article
                </div>
                <h1 class="text-3xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">${title}</h1>
                <div class="flex items-center justify-center text-gray-500 mb-8 border-b border-gray-100 pb-8">
                    <div class="flex items-center">
                        <img src="assets/profile-photo.jpg" alt="${author}" class="w-12 h-12 rounded-full mr-4 object-cover shadow-sm border border-gray-100">
                        <div class="text-left">
                            <p class="font-bold text-gray-900">${author}</p>
                            <p class="text-sm">${formattedDate} &bull; 5 min read</p>
                        </div>
                    </div>
                </div>
            </header>
            
            <div class="mb-12 rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-gray-100">
                <img src="${imageUrl}" alt="${title}" class="w-full h-auto object-cover max-h-[500px]">
            </div>
            
            <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed mx-auto">
                ${htmlContent}
            </div>
            
            <div class="mt-16 pt-8 border-t border-gray-200 text-center">
                <p class="text-gray-600 font-medium mb-4">Share this article</p>
                <div class="flex justify-center space-x-4">
                    <button class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                        <i class="fab fa-linkedin-in"></i>
                    </button>
                    <button class="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:opacity-90 transition-opacity" onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied!')">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}
