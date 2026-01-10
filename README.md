# SamaBrains Solutions - Personal Website

A beautiful, modern personal website built with HTML, TailwindCSS, and vanilla JavaScript.

## Features

- **Modern UI Design**: Clean, professional interface with gradient accents
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Interactive Elements**: 
  - Typing animation for professional titles
  - Smooth scrolling navigation
  - Hover effects and transitions
  - Mobile-friendly hamburger menu
- **Sections Included**:
  - Hero section with call-to-action
  - About section with skills
  - Services showcase
  - Portfolio gallery
  - Contact form with validation
- **Performance Optimized**: Throttled scroll events and lazy loading
- **Accessibility**: Semantic HTML5 structure

## Technologies Used

- **HTML5**: Semantic markup structure
- **TailwindCSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No dependencies, pure JS interactions
- **Font Awesome**: Icon library
- **Google Fonts**: Inter font family

## Getting Started

1. Clone or download the project files
2. Open `index.html` in your web browser
3. Or use a local server for better development experience

### Using a Local Server

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using Live Server in VS Code
Right-click index.html -> Open with Live Server
```

## File Structure

```
personal-website/
├── index.html          # Main HTML file
├── script.js           # JavaScript functionality
├── README.md           # Project documentation
├── railway.json        # Railway deployment config
├── Procfile           # Process definition for Railway
├── DEPLOYMENT.md      # Deployment instructions
└── assets/             # Images and static files (if needed)
```

## Customization

### Changing Personal Information

Edit the following in `index.html`:

- Name: Update the `<h1>` tag in the hero section
- Professional titles: Modify the `titles` array in `script.js`
- Contact information: Update the contact section details
- Portfolio items: Replace images and descriptions in the portfolio section

### Color Scheme

The primary gradient is defined in the CSS:

```css
.gradient-text {
    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}
```

Modify these colors to match your brand preferences.

### Adding New Sections

1. Add a new `<section>` element to `index.html`
2. Update the navigation menu with the new link
3. Add corresponding JavaScript functionality if needed

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized images with lazy loading
- Throttled scroll events for better performance
- Minimal JavaScript footprint
- CSS animations using transforms for GPU acceleration

## Deployment

This project is configured for Railway deployment. See `DEPLOYMENT.md` for detailed instructions.

## Auto-Tracking Changes

To automatically track and commit changes:

### Windows (Quick):
```bash
# Run this batch file to track changes
./track-changes.bat
```

### Linux/Mac (Auto-commit):
```bash
# Make script executable
chmod +x auto-commit.sh

# Run auto-commit (will commit and push if changes exist)
./auto-commit.sh
```

### Manual Tracking:
```bash
# Add all changes
git add -A

# Commit with message
git commit -m "Your change description"

# Push to GitHub
git push origin main
```

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For questions or customization requests, please reach out through the contact form on the website or via email.

---

Built with ❤️ by SamaBrains Solutions
