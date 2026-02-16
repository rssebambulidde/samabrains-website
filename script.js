// Typing Effect
const titles = [
    "AI Automation Specialist",
    "Web Application Developer", 
    "Data Analytics Expert",
    "Data Engineering Professional",
    "Smart Digital Solutions"
];

let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

function typeEffect() {
    const currentTitle = titles[titleIndex];
    const typedTextElement = document.getElementById('typed-text');
    
    if (!typedTextElement) return;
    
    if (isDeleting) {
        typedTextElement.textContent = currentTitle.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
    } else {
        typedTextElement.textContent = currentTitle.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 100;
    }
    
    if (!isDeleting && charIndex === currentTitle.length) {
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length;
        typingSpeed = 500;
    }
    
    setTimeout(typeEffect, typingSpeed);
}

// Mobile Menu Toggle with accessibility improvements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.toggle('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', !isHidden);
        
        // Update aria-label
        mobileMenuBtn.setAttribute('aria-label', isHidden ? 'Open mobile menu' : 'Close mobile menu');
    });
    
    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.setAttribute('aria-label', 'Open mobile menu');
        });
    });
    
    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.setAttribute('aria-label', 'Open mobile menu');
            mobileMenuBtn.focus();
        }
    });
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Performance optimization: Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Consolidated scroll handler for all scroll-related functionality
const handleScroll = throttle(() => {
    const scrolled = window.pageYOffset;
    
    // Navbar Background on Scroll
    const navbar = document.querySelector('nav');
    if (navbar) {
        if (scrolled > 50) {
            navbar.classList.add('bg-white/95');
            navbar.classList.remove('bg-white/90');
        } else {
            navbar.classList.add('bg-white/90');
            navbar.classList.remove('bg-white/95');
        }
    }
    
    // Parallax Effect for Hero Section (disabled on mobile for performance)
    if (window.innerWidth > 768) {
        const hero = document.querySelector('#home');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }
    
    // Active Navigation Link Highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrolled >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('text-orange-600');
        link.classList.add('text-gray-700');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.remove('text-gray-700');
            link.classList.add('text-orange-600');
        }
    });
    
    // Back to Top Button visibility
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        if (scrolled > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    }
}, 100);

// Single scroll event listener
window.addEventListener('scroll', handleScroll, { passive: true });

// Contact Form Handling with Brevo integration
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Get form data
        const name = this.querySelector('#name').value.trim();
        const email = this.querySelector('#email').value.trim();
        const message = this.querySelector('#message').value.trim();
        
        // Basic validation
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            // Send to your serverless function/backend endpoint
            // Update this URL to match your deployment
            // For Railway Functions: '/api/send-email'
            // For separate backend: 'https://your-backend-url.com/api/send-email'
            const endpoint = '/api/send-email';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                this.reset();
            } else {
                showNotification(data.message || 'There was an error sending your message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showNotification('Network error. Please check your connection and try again.', 'error');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-20 right-6 px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
    
    // Set background color based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
    } else {
        notification.classList.add('bg-orange-500', 'text-white');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Slide in notification
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Parallax effect is now handled in the consolidated scroll handler above

// Card hover effects are handled by CSS (.card-hover:hover) for better performance

// Error handling for external resources
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
        console.warn('Failed to load external resource:', e.target.src || e.target.href);
        // Could show a fallback notification here if needed
    }
}, true);

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeIcon = document.getElementById('dark-mode-icon');
const htmlElement = document.documentElement;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    htmlElement.classList.add('dark-mode');
    darkModeIcon.classList.remove('fa-moon');
    darkModeIcon.classList.add('fa-sun');
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        htmlElement.classList.toggle('dark-mode');
        
        // Update icon
        if (htmlElement.classList.contains('dark-mode')) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Back to Top Button click handler
const backToTopButton = document.getElementById('back-to-top');

if (backToTopButton) {
    // Smooth scroll to top when clicked
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Show page once DOM and styles are ready (prevents FOUC)
    document.documentElement.classList.add('loaded');
    
    // Check if required elements exist before initializing
    if (document.getElementById('typed-text')) {
        typeEffect();
    }
    
    // Set dynamic copyright year
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Add loading animation
    document.body.classList.add('loaded');
});

// Active navigation link highlighting is now handled in the consolidated scroll handler above

// Portfolio Image Modal with accessibility improvements
document.querySelectorAll('#portfolio img').forEach(img => {
    img.addEventListener('click', function() {
        // Create modal for larger image view
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Image preview');
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-full">
                <img src="${this.src}" alt="${this.alt}" class="max-w-full max-h-full rounded-lg">
                <button class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded" aria-label="Close image preview">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Focus the close button
        const closeButton = modal.querySelector('button');
        closeButton.focus();
        
        // Close modal on click
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('button')) {
                modal.remove();
                document.body.style.overflow = ''; // Restore scrolling
            }
        });
        
        // Close modal on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.style.overflow = ''; // Restore scrolling
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
});

// Throttle function is now defined at the top and used in consolidated scroll handler
