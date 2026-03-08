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

let allPosts = null; // Module-level store for search/tag filtering
let allPostsCache = null; // Cached fetch result shared across features
let currentPage = 1;
const POSTS_PER_PAGE = 9;

async function initBlog() {
    const isBlogFeed = document.getElementById('blog-grid');
    const isSinglePost = document.getElementById('post-content');

    if (isBlogFeed) {
        allPosts = await fetchPostsFromCMS();
        renderBlogFeed(allPosts);
        initSearch();
        initTagFilters();
    }

    if (isSinglePost) {
        // Support clean URLs: /blog/slug (primary) and legacy ?id=slug (fallback)
        let slug = null;
        const pathMatch = window.location.pathname.match(/^\/blog\/(.+?)(?:\/|$)/);
        if (pathMatch) {
            slug = pathMatch[1];
        } else {
            slug = new URLSearchParams(window.location.search).get('id');
        }

        if (slug) {
            const result = await fetchSinglePostFromCMS(slug);
            renderSinglePost(result);
        } else {
            renderSinglePost(null);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}

// --- Data Fetching ---

async function fetchPostsFromCMS() {
    if (allPostsCache) return allPostsCache;
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allPostsCache = await response.json();
        return allPostsCache;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return { items: [] };
    }
}

async function fetchSinglePostFromCMS(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${slug}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return { post: data.items[0], includes: data.includes };
        }
        return null;
    } catch (error) {
        console.error("Error fetching single post:", error);
        return null;
    }
}

// --- Helpers ---

function getImageUrl(assetId, includes) {
    if (!includes || !includes.Asset) return 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&q=80';
    const asset = includes.Asset.find(a => a.sys.id === assetId);
    if (asset && asset.fields && asset.fields.file) {
        return `https:${asset.fields.file.url}`;
    }
    return 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&q=80';
}

function calculateReadingTime(nodes) {
    if (!nodes) return '1 min read';
    let text = '';
    function extractText(nodeList) {
        nodeList.forEach(node => {
            if (node.value) text += node.value + ' ';
            if (node.content) extractText(node.content);
        });
    }
    extractText(nodes);
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${minutes} min read`;
}

function updateMetaTags(title, description, imageUrl, url) {
    function setMeta(attr, attrValue, content) {
        let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
        if (el) {
            el.setAttribute('content', content);
        } else {
            el = document.createElement('meta');
            el.setAttribute(attr, attrValue);
            el.setAttribute('content', content);
            document.head.appendChild(el);
        }
    }
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'article');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'description', description);
}

// --- Search ---

function initSearch() {
    const searchInput = document.getElementById('blog-search');
    if (!searchInput || !allPosts) return;

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = searchInput.value.trim().toLowerCase();
            if (query === '') {
                renderBlogFeed(allPosts);
                return;
            }
            const filtered = {
                ...allPosts,
                items: allPosts.items.filter(post => {
                    const fields = post.fields;
                    if (!fields) return false;
                    const title = (fields.title || fields.tittle || '').toLowerCase();
                    const excerpt = (fields.excerpt || '').toLowerCase();
                    return title.includes(query) || excerpt.includes(query);
                })
            };
            renderBlogFeed(filtered);
        }, 300);
    });
}

// --- Tag Filters ---

function getPostTags(fields) {
    // Try multiple possible field names for tags
    return fields?.tags || fields?.tag || fields?.categories || fields?.category || [];
}

function initTagFilters() {
    const container = document.getElementById('tag-filter-buttons');
    const wrapper = document.getElementById('tag-filters');
    if (!container || !wrapper || !allPosts) return;

    const tagSet = new Set();
    (allPosts.items || []).forEach(post => {
        const tags = getPostTags(post.fields);
        if (Array.isArray(tags)) {
            tags.forEach(tag => tagSet.add(tag));
        } else if (typeof tags === 'string' && tags) {
            tagSet.add(tags);
        }
    });

    if (tagSet.size === 0) return;

    wrapper.classList.remove('hidden');

    let html = `<button class="tag-filter-btn active px-4 py-1.5 rounded-full text-sm font-medium bg-orange-500 text-white transition-colors" data-tag="all">All</button>`;
    Array.from(tagSet).sort().forEach(tag => {
        html += `<button class="tag-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-orange-100 hover:text-orange-700 transition-colors" data-tag="${tag}">${tag}</button>`;
    });
    container.innerHTML = html;

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.tag-filter-btn');
        if (!btn) return;

        container.querySelectorAll('.tag-filter-btn').forEach(b => {
            b.classList.remove('bg-orange-500', 'text-white', 'active');
            b.classList.add('bg-gray-200', 'text-gray-700');
        });
        btn.classList.add('bg-orange-500', 'text-white', 'active');
        btn.classList.remove('bg-gray-200', 'text-gray-700');

        const selectedTag = btn.dataset.tag;
        if (selectedTag === 'all') {
            renderBlogFeed(allPosts);
        } else {
            renderBlogFeed({
                ...allPosts,
                items: allPosts.items.filter(post => {
                    const tags = getPostTags(post.fields);
                    return Array.isArray(tags) ? tags.includes(selectedTag) : tags === selectedTag;
                })
            });
        }
    });
}

// --- Blog Feed Rendering ---

function renderBlogFeed(posts, resetPage) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    if (resetPage !== false) currentPage = 1;

    grid.innerHTML = '';

    const items = posts.items || [];

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
                <p>No posts available yet. Check back soon!</p>
            </div>
        `;
        renderPaginationControls(null, 0, 0);
        return;
    }

    const totalPages = Math.ceil(items.length / POSTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const pageItems = items.slice(start, start + POSTS_PER_PAGE);

    pageItems.forEach((post, index) => {
        const fields = post.fields;
        if (!fields) return;

        const title = fields.title || fields.tittle || 'Untitled Post';
        const slug = fields.slug || '';
        const excerpt = fields.excerpt || 'Read more about this topic...';
        const rawTags = getPostTags(fields);
        const tags = Array.isArray(rawTags) ? rawTags : (rawTags ? [rawTags] : []);

        let formattedDate = 'Recent';
        if (fields.date) {
            const d = new Date(fields.date);
            formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        let imageUrl = getImageUrl(fields.coverImage?.sys?.id, posts.includes);

        // Filter out series tags from display
        const displayTags = tags.filter(t => !t.startsWith('series:'));
        const tagBadges = displayTags.map(tag =>
            `<span class="inline-block bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">${tag}</span>`
        ).join('');

        const card = document.createElement('a');
        card.href = `/blog/${slug}`;
        card.className = "group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 card-hover fade-in";
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="relative h-56 overflow-hidden bg-gray-100 img-skeleton">
                <img src="${imageUrl}" alt="${title}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&q=80'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="p-6">
                <div class="flex items-center flex-wrap gap-2 text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
                    <span>${formattedDate}</span>
                    ${tagBadges}
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

    renderPaginationControls(posts, items.length, totalPages);
}

function renderPaginationControls(posts, totalItems, totalPages) {
    const existing = document.getElementById('blog-pagination');
    if (existing) existing.remove();

    if (!posts || totalPages <= 1) return;

    const gridParent = document.getElementById('blog-grid').parentElement;
    const nav = document.createElement('nav');
    nav.id = 'blog-pagination';
    nav.setAttribute('aria-label', 'Blog pagination');
    nav.className = 'mt-12 flex justify-center items-center gap-2 flex-wrap';

    function makeBtn(label, page, isCurrent, isDisabled) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.disabled = isDisabled;
        btn.className = [
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            isCurrent ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-500 hover:text-orange-600',
            isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        ].join(' ');

        if (!isDisabled && !isCurrent) {
            btn.addEventListener('click', () => {
                currentPage = page;
                renderBlogFeed(posts, false);
                document.getElementById('blog-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
        return btn;
    }

    nav.appendChild(makeBtn('\u2190 Prev', currentPage - 1, false, currentPage === 1));

    const delta = 2;
    for (let p = Math.max(1, currentPage - delta); p <= Math.min(totalPages, currentPage + delta); p++) {
        nav.appendChild(makeBtn(String(p), p, p === currentPage, false));
    }

    nav.appendChild(makeBtn('Next \u2192', currentPage + 1, false, currentPage === totalPages));

    gridParent.appendChild(nav);
}

// --- Single Post Rendering ---

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

    const title = fields.title || fields.tittle || 'Untitled Post';
    const author = fields.author || 'SamaBrains Team';
    const excerpt = fields.excerpt || title;
    const rawTags = getPostTags(fields);
    const tags = Array.isArray(rawTags) ? rawTags : (rawTags ? [rawTags] : []);

    // Reading time
    const readingTime = calculateReadingTime(
        fields.content && fields.content.content ? fields.content.content : null
    );

    // Table of Contents + Rich Text rendering
    let htmlContent = '<p>No content available.</p>';
    let toc = null;
    if (fields.content && fields.content.content) {
        toc = generateTableOfContents(fields.content.content);
        const headingIds = toc ? toc.headingIds : null;
        const processedNodes = mergeConsecutiveCodeParagraphs(fields.content.content);
        htmlContent = renderRichText(processedNodes, headingIds);
    }

    let formattedDate = 'Recent';
    if (fields.date) {
        const d = new Date(fields.date);
        formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const imageUrl = getImageUrl(fields.coverImage?.sys?.id, includes);

    // SEO — use canonical /blog/ URL
    const canonicalPostUrl = `https://samabrains.com/blog/${fields.slug || ''}`;
    document.title = `${title} | SamaBrains Blog`;
    updateMetaTags(title, excerpt, imageUrl, canonicalPostUrl);

    // Canonical link
    const canonicalLink = document.getElementById('canonical-link');
    if (canonicalLink) canonicalLink.setAttribute('href', canonicalPostUrl);

    // JSON-LD structured data
    const schemaOrg = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": excerpt,
        "url": canonicalPostUrl,
        "datePublished": fields.date || '',
        "dateModified": fields.date || '',
        "author": { "@type": "Person", "name": author, "url": "https://samabrains.com" },
        "publisher": { "@type": "Organization", "name": "SamaBrains", "url": "https://samabrains.com", "logo": { "@type": "ImageObject", "url": "https://samabrains.com/favicon.svg" } },
        "image": imageUrl,
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalPostUrl }
    };
    const ldScript = document.getElementById('structured-data');
    if (ldScript) ldScript.textContent = JSON.stringify(schemaOrg);

    // Tag badges
    const tagBadgesHtml = tags.length > 0
        ? `<div class="flex flex-wrap justify-center gap-2 mb-6">${tags.map(tag =>
            `<span class="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">${tag}</span>`
        ).join('')}</div>`
        : '';

    // Build canonical share URL
    const slug = fields.slug || '';
    const canonicalUrl = `https://samabrains.com/blog/${slug}`;

    container.innerHTML = `
        <article class="fade-in">
            <header class="mb-10 text-center">
                <div class="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold tracking-wider mb-4">
                    Article
                </div>
                ${tagBadgesHtml}
                <h1 class="text-3xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">${title}</h1>
                <div class="flex items-center justify-center text-gray-500 mb-8 border-b border-gray-100 pb-8">
                    <div class="flex items-center">
                        <img src="/assets/profile-photo.jpg" alt="${author}" class="w-12 h-12 rounded-full mr-4 object-cover shadow-sm border border-gray-100">
                        <div class="text-left">
                            <p class="font-bold text-gray-900">${author}</p>
                            <p class="text-sm">${formattedDate} &bull; ${readingTime}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div class="mb-12 rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-gray-100 img-skeleton">
                <img src="${imageUrl}" alt="${title}" loading="lazy" class="w-full h-auto object-cover max-h-[500px]">
            </div>

            ${toc ? toc.mobileHtml : ''}

            <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed mx-auto">
                ${htmlContent}
            </div>

            <div id="share-section" class="mt-16 pt-8 border-t border-gray-200 text-center">
                <p class="text-gray-600 font-medium mb-4">Share this article</p>
                <div class="sharethis-inline-share-buttons"
                    data-url="${canonicalUrl}"
                    data-title="${title}"
                    data-image="${imageUrl}"
                    data-description="${excerpt}"></div>
            </div>
        </article>
    `;

    // Re-initialize ShareThis for dynamically rendered content
    if (window.__sharethis__) {
        window.__sharethis__.initialize();
    }

    // Sidebar ToC (desktop)
    const sidebarInner = document.getElementById('toc-sidebar-inner');
    if (sidebarInner && toc) {
        sidebarInner.innerHTML = toc.sidebarHtml;
        initTocScrollSpy(toc.headingIds);
    }

    // Mobile ToC toggle
    const tocToggle = document.getElementById('toc-toggle-mobile');
    const tocList = document.getElementById('toc-list-mobile');
    const tocChevron = document.querySelector('.toc-chevron-mobile');
    if (tocToggle && tocList) {
        tocToggle.addEventListener('click', () => {
            const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
            tocToggle.setAttribute('aria-expanded', String(!isExpanded));
            tocList.style.display = isExpanded ? 'none' : 'block';
            if (tocChevron) tocChevron.style.transform = isExpanded ? 'rotate(180deg)' : '';
        });
    }

    // Syntax highlighting + copy buttons
    if (window.Prism) {
        Prism.highlightAll();
        setTimeout(initCopyButtons, 100);
    } else {
        window.addEventListener('load', () => {
            if (window.Prism) Prism.highlightAll();
            initCopyButtons();
        });
    }

    // Reading progress bar
    initReadingProgress();

    // Breadcrumbs
    injectBreadcrumbs(title, fields.slug);

    // Related posts (async, non-blocking)
    renderRelatedPosts(fields.slug, tags);

    // Series navigation (async, non-blocking)
    renderSeriesNav(fields.slug, tags, container);
}

// --- Reading Progress Bar ---

function initReadingProgress() {
    const bar = document.getElementById('reading-progress');
    if (!bar) return;

    function updateProgress() {
        const article = document.querySelector('#post-content article');
        if (!article) return;

        const articleTop = article.getBoundingClientRect().top + window.scrollY;
        const articleHeight = article.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrolled = window.scrollY - articleTop;
        const scrollable = articleHeight - windowHeight;

        if (scrollable <= 0) { bar.style.width = '100%'; return; }
        const progress = Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
        bar.style.width = progress + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
}

// --- Copy-to-Clipboard ---

function initCopyButtons() {
    document.querySelectorAll('.prose pre').forEach(pre => {
        if (pre.querySelector('.copy-code-btn')) return;
        const code = pre.querySelector('code');
        if (!code) return;

        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code to clipboard');

        btn.addEventListener('click', () => {
            const text = code.innerText;
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        });

        pre.appendChild(btn);
    });
}

// --- Breadcrumbs ---

function injectBreadcrumbs(title, slug) {
    const backLink = document.querySelector('a[href="/blog.html"]');
    if (!backLink) return;

    const breadcrumb = document.createElement('nav');
    breadcrumb.id = 'breadcrumbs';
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');
    breadcrumb.className = 'flex items-center gap-2 text-sm text-gray-500 mb-3';
    breadcrumb.innerHTML = `
        <a href="/" class="hover:text-orange-600 transition-colors">Home</a>
        <i class="fas fa-chevron-right text-xs text-gray-400"></i>
        <a href="/blog.html" class="hover:text-orange-600 transition-colors">Blog</a>
        <i class="fas fa-chevron-right text-xs text-gray-400"></i>
        <span class="text-gray-700 font-medium truncate max-w-xs">${title}</span>
    `;
    backLink.parentNode.insertBefore(breadcrumb, backLink);

    // BreadcrumbList JSON-LD
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://samabrains.com/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://samabrains.com/blog.html" },
            { "@type": "ListItem", "position": 3, "name": title, "item": `https://samabrains.com/blog/${slug}` }
        ]
    };
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.id = 'breadcrumb-data';
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(breadcrumbScript);
}

// --- Related Posts ---

async function renderRelatedPosts(currentSlug, currentTags) {
    if (!currentTags || currentTags.length === 0) return;

    const data = await fetchPostsFromCMS();
    const items = (data.items || []).filter(p => p.fields && p.fields.slug !== currentSlug);

    const scored = items.map(post => {
        const tags = getPostTags(post.fields);
        const tagsArr = Array.isArray(tags) ? tags : (tags ? [tags] : []);
        // Exclude series tags from matching
        const contentTags = tagsArr.filter(t => !t.startsWith('series:'));
        const currentContentTags = currentTags.filter(t => !t.startsWith('series:'));
        const overlap = contentTags.filter(t => currentContentTags.includes(t)).length;
        return { post, overlap, date: post.fields.date || '' };
    }).filter(s => s.overlap > 0);

    scored.sort((a, b) => b.overlap - a.overlap || new Date(b.date) - new Date(a.date));
    const related = scored.slice(0, 3);
    if (related.length === 0) return;

    const cards = related.map(({ post }) => {
        const f = post.fields;
        const imgUrl = getImageUrl(f.coverImage?.sys?.id, data.includes);
        const title = f.title || f.tittle || 'Untitled';
        const slug = f.slug || '';
        const excerpt = f.excerpt || '';
        const date = f.date ? new Date(f.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        return `
            <a href="/blog/${slug}" class="group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 card-hover">
                <div class="h-44 overflow-hidden bg-gray-100 img-skeleton">
                    <img src="${imgUrl}" alt="${title}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&q=80'">
                </div>
                <div class="p-5">
                    <p class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">${date}</p>
                    <h4 class="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">${title}</h4>
                    <p class="text-sm text-gray-600 line-clamp-2">${excerpt}</p>
                </div>
            </a>`;
    }).join('');

    const section = document.createElement('div');
    section.className = 'mt-16 pt-8 border-t border-gray-200';
    section.id = 'related-posts';
    section.innerHTML = `
        <h3 class="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">${cards}</div>
    `;

    const shareDiv = document.getElementById('share-section');
    if (shareDiv) {
        shareDiv.parentNode.insertBefore(section, shareDiv);
    } else {
        const article = document.querySelector('#post-content article');
        if (article) article.appendChild(section);
    }
}

// --- Post Series Navigation ---

async function renderSeriesNav(currentSlug, currentTags, container) {
    const seriesTags = (currentTags || []).filter(t => t.startsWith('series:'));
    if (seriesTags.length === 0) return;

    const seriesName = seriesTags[0].replace('series:', '').trim();

    const data = await fetchPostsFromCMS();
    const seriesPosts = (data.items || [])
        .filter(p => {
            const tags = getPostTags(p.fields);
            const tagsArr = Array.isArray(tags) ? tags : (tags ? [tags] : []);
            return tagsArr.some(t => t === seriesTags[0]);
        })
        .sort((a, b) => new Date(a.fields.date || 0) - new Date(b.fields.date || 0));

    if (seriesPosts.length < 2) return;

    const currentIndex = seriesPosts.findIndex(p => p.fields.slug === currentSlug);

    const listItems = seriesPosts.map((post, i) => {
        const f = post.fields;
        const isCurrentPost = f.slug === currentSlug;
        const postTitle = f.title || f.tittle || 'Untitled';
        return isCurrentPost
            ? `<li class="flex items-center gap-2 py-1.5">
                <span class="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">${i + 1}</span>
                <span class="font-semibold text-gray-900 text-sm">${postTitle}</span>
                <span class="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Current</span>
              </li>`
            : `<li class="flex items-center gap-2 py-1.5">
                <span class="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-bold flex-shrink-0">${i + 1}</span>
                <a href="/blog/${f.slug}" class="text-sm text-orange-600 hover:underline">${postTitle}</a>
              </li>`;
    }).join('');

    const prevPost = currentIndex > 0 ? seriesPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null;

    const navLinks = `
        <div class="flex justify-between mt-4 pt-4 border-t border-gray-100">
            ${prevPost ? `<a href="/blog/${prevPost.fields.slug}" class="text-sm text-orange-600 hover:underline flex items-center gap-1">
                <i class="fas fa-arrow-left text-xs"></i> Previous
            </a>` : '<span></span>'}
            ${nextPost ? `<a href="/blog/${nextPost.fields.slug}" class="text-sm text-orange-600 hover:underline flex items-center gap-1">
                Next <i class="fas fa-arrow-right text-xs"></i>
            </a>` : '<span></span>'}
        </div>
    `;

    const seriesBox = document.createElement('div');
    seriesBox.id = 'series-nav';
    seriesBox.className = 'mb-10 bg-orange-50 border border-orange-200 rounded-2xl p-6';
    seriesBox.innerHTML = `
        <div class="flex items-center gap-2 mb-4">
            <i class="fas fa-layer-group text-orange-500"></i>
            <h3 class="text-sm font-bold text-orange-700 uppercase tracking-wider m-0">Series: ${seriesName}</h3>
        </div>
        <ul class="space-y-0.5 list-none m-0 p-0">${listItems}</ul>
        ${navLinks}
    `;

    const article = container.querySelector('article');
    if (article) article.prepend(seriesBox);
}

function initTocScrollSpy(headingIds) {
    if (!headingIds || headingIds.size === 0) return;

    const ids = Array.from(headingIds.values());
    const links = document.querySelectorAll('#toc-sidebar-inner a[href^="#"]');
    if (links.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(link => link.classList.remove('toc-active'));
                const activeLink = document.querySelector(`#toc-sidebar-inner a[href="#${entry.target.id}"]`);
                if (activeLink) activeLink.classList.add('toc-active');
            }
        });
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

// --- Table of Contents ---

function generateTableOfContents(nodes) {
    if (!nodes) return null;

    const headings = [];
    nodes.forEach(node => {
        if (['heading-1', 'heading-2', 'heading-3', 'heading-4'].includes(node.nodeType)) {
            const text = node.content.map(n => n.value || '').join('');
            const level = parseInt(node.nodeType.split('-')[1]);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            headings.push({ text, level, id });
        }
    });

    if (headings.length < 2) return null;

    const minLevel = Math.min(...headings.map(h => h.level));

    const tocItemsSidebar = headings.map(h => {
        const indent = (h.level - minLevel) * 12;
        return `<li style="padding-left: ${indent}px">
            <a href="#${h.id}" class="block py-1.5 text-[13px] text-gray-500 hover:text-orange-600 transition-colors border-l-2 border-transparent hover:border-orange-500 pl-3 leading-snug">${h.text}</a>
        </li>`;
    }).join('');

    const tocItemsMobile = headings.map(h => {
        const indent = (h.level - minLevel) * 16;
        return `<li style="padding-left: ${indent}px">
            <a href="#${h.id}" class="block py-1.5 text-sm text-gray-600 hover:text-orange-600 transition-colors border-l-2 border-transparent hover:border-orange-500 pl-3">${h.text}</a>
        </li>`;
    }).join('');

    const sidebarHtml = `
        <nav class="toc-sidebar-nav" aria-label="Table of Contents">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                <i class="fas fa-list-ul mr-2 text-orange-500"></i>On this page
            </h3>
            <ul class="space-y-0.5 list-none ml-0">
                ${tocItemsSidebar}
            </ul>
        </nav>
    `;

    const mobileHtml = `
        <nav class="toc-mobile bg-gray-50 rounded-2xl p-6 mb-10 border border-gray-100 lg:hidden" aria-label="Table of Contents">
            <button class="flex items-center justify-between w-full text-left" id="toc-toggle-mobile" aria-expanded="false">
                <h3 class="text-lg font-bold text-gray-900 m-0">
                    <i class="fas fa-list-ul mr-2 text-orange-500"></i>Table of Contents
                </h3>
                <i class="fas fa-chevron-down text-gray-400 toc-chevron-mobile transition-transform"></i>
            </button>
            <ul class="mt-4 space-y-1 list-none ml-0" id="toc-list-mobile" style="display: none;">
                ${tocItemsMobile}
            </ul>
        </nav>
    `;

    const headingIds = new Map();
    headings.forEach(h => headingIds.set(h.text, h.id));

    return { sidebarHtml, mobileHtml, headingIds };
}

// --- Rich Text Rendering ---

function isCodeParagraph(node) {
    return node.nodeType === 'paragraph' &&
        node.content &&
        node.content.length > 0 &&
        node.content.every(n => n.marks && n.marks.some(m => m.type === 'code'));
}

function mergeConsecutiveCodeParagraphs(nodes) {
    const merged = [];
    let i = 0;
    while (i < nodes.length) {
        if (isCodeParagraph(nodes[i])) {
            const codeLines = [];
            while (i < nodes.length && isCodeParagraph(nodes[i])) {
                codeLines.push(nodes[i].content.map(n => n.value || '').join(''));
                i++;
            }
            merged.push({ nodeType: 'code-block', lines: codeLines });
        } else {
            merged.push(nodes[i]);
            i++;
        }
    }
    return merged;
}

function renderRichText(nodes, headingIds) {
    return nodes.map(node => {
        switch (node.nodeType) {
            case 'paragraph':
                return `<p>${renderInline(node.content)}</p>`;
            case 'heading-1':
            case 'heading-2':
            case 'heading-3':
            case 'heading-4': {
                const tag = node.nodeType.replace('heading-', 'h');
                const text = node.content.map(n => n.value || '').join('');
                const id = headingIds && headingIds.has(text) ? ` id="${headingIds.get(text)}"` : '';
                return `<${tag}${id}>${renderInline(node.content)}</${tag}>`;
            }
            case 'blockquote':
                return `<blockquote>${renderRichText(node.content, headingIds)}</blockquote>`;
            case 'unordered-list':
                return `<ul>${renderRichText(node.content, headingIds)}</ul>`;
            case 'ordered-list':
                return `<ol>${renderRichText(node.content, headingIds)}</ol>`;
            case 'list-item':
                return `<li>${renderRichText(node.content, headingIds)}</li>`;
            case 'hr':
                return '<hr>';
            case 'hyperlink':
                return `<a href="${node.data.uri}" target="_blank" rel="noopener noreferrer">${renderInline(node.content)}</a>`;
            case 'code-block': {
                const codeText = node.lines.map(line =>
                    line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                ).join('\n');
                return `<pre class="language-javascript"><code class="language-javascript">${codeText}</code></pre>`;
            }
            default:
                return '';
        }
    }).join('');
}

function renderInline(nodes) {
    if (!nodes) return '';
    return nodes.map(node => {
        if (node.nodeType === 'hyperlink') {
            return `<a href="${node.data.uri}" target="_blank" rel="noopener noreferrer">${renderInline(node.content)}</a>`;
        }
        let text = node.value || '';
        if (!node.marks || node.marks.length === 0) return text;
        node.marks.forEach(mark => {
            switch (mark.type) {
                case 'bold':
                    text = `<strong>${text}</strong>`;
                    break;
                case 'italic':
                    text = `<em>${text}</em>`;
                    break;
                case 'code':
                    text = `<code>${text}</code>`;
                    break;
                case 'underline':
                    text = `<u>${text}</u>`;
                    break;
            }
        });
        return text;
    }).join('');
}
