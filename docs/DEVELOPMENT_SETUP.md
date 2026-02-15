# FanCast AI - Development Setup Guide

This guide provides comprehensive instructions for setting up the FanCast AI development environment, including the advanced Script Editor Interface, from initial installation to advanced development workflows.

## 📋 Prerequisites

### Required Software

#### Node.js (v18.0.0 or higher)
```bash
# Check your Node.js version
node --version

# If you need to install or upgrade Node.js:
# Visit https://nodejs.org/ or use a version manager like nvm
```

#### Package Manager
We recommend **pnpm** for faster installs and better disk efficiency:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

#### Git
```bash
# Check Git installation
git --version

# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Recommended Development Tools

#### Code Editor
- **VS Code** (recommended) with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint
  - Auto Rename Tag
  - Bracket Pair Colorizer

#### Browser Extensions
- **React Developer Tools** - For debugging React components
- **Redux DevTools** - For state management debugging (future use)

## 🚀 Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/fancast-ai.git

# Navigate to project directory
cd fancast-ai
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# This will install:
# - React 18+ and related packages
# - Tailwind CSS 4.0+ with plugins
# - Vite build tool
# - Lucide React icons
# - Development tools and linters
```

### 3. Environment Setup

```bash
# Copy environment template (when available)
cp .env.example .env.local

# Edit environment variables as needed
# Note: Current version doesn't require environment variables
```

## 🛠 Development Workflow

### Starting Development Server

```bash
# Start the development server
pnpm run dev

# The application will be available at:
# http://localhost:5173

# The server supports:
# - Hot module replacement (HMR)
# - Fast refresh for React components
# - Automatic browser refresh on changes
```

### Available Scripts

```bash
# Development
pnpm run dev          # Start development server with HMR
pnpm run dev --host   # Start server accessible on network

# Building
pnpm run build        # Build for production
pnpm run preview      # Preview production build locally

# Code Quality
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint issues automatically
pnpm run format       # Format code with Prettier

# Testing (when implemented)
pnpm run test         # Run unit tests
pnpm run test:watch   # Run tests in watch mode
pnpm run test:coverage # Generate coverage report
```

## 📁 Project Structure Deep Dive

```
fancast-ai/
├── public/                     # Static assets
│   ├── favicon.ico            # App favicon
│   └── index.html             # HTML template
├── src/
│   ├── components/            # Reusable React components (future)
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── hooks/                # Custom React hooks (future)
│   ├── services/             # API and external service integrations
│   ├── utils/                # Utility functions and helpers
│   ├── styles/               # Additional CSS files
│   ├── App.jsx               # Main application component
│   ├── App.css               # Global styles and Tailwind config
│   └── main.jsx              # Application entry point
├── docs/                     # Documentation
│   ├── DEVELOPMENT_SETUP.md  # This file
│   ├── FEATURE_SPECIFICATIONS.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── API_INTEGRATION.md
│   └── DEPLOYMENT.md
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
├── pnpm-lock.yaml           # Lock file for exact dependency versions
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── eslint.config.js         # ESLint configuration
└── README.md                # Project overview
```

## 🎨 Development Guidelines

### Component Development

#### File Naming Conventions
```bash
# Components: PascalCase
src/components/UserProfile.jsx
src/components/AudioPlayer.jsx

# Hooks: camelCase with 'use' prefix
src/hooks/useAudioPlayer.js
src/hooks/useUserTier.js

# Utilities: camelCase
src/utils/formatDuration.js
src/utils/calculateCredits.js
```

#### Component Structure
```jsx
import React, { useState, useEffect } from 'react';
import { Icon } from 'lucide-react';

// Component with proper JSDoc documentation
/**
 * AudioPlayer component for FanCast AI
 * @param {Object} props - Component props
 * @param {string} props.title - Audio title
 * @param {Function} props.onPlay - Play callback
 */
const AudioPlayer = ({ title, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Component logic here

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      {/* Component JSX */}
    </div>
  );
};

export default AudioPlayer;
```

### Styling Guidelines

#### Tailwind CSS Best Practices
```jsx
// ✅ Good: Semantic class grouping
<div className="
  flex items-center justify-between
  bg-slate-800 border border-slate-700
  rounded-lg p-6 mb-4
  hover:bg-slate-700 transition-colors
">

// ❌ Avoid: Long, unorganized class strings
<div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-6 mb-4 hover:bg-slate-700 transition-colors">
```

#### Custom CSS Variables
```css
/* Use CSS variables for brand consistency */
:root {
  --color-primary: #008080;    /* Teal */
  --color-accent: #FFA500;     /* Orange */
  --color-background: #0a0a0a; /* Dark background */
}

/* Apply in Tailwind classes */
.gradient-teal-orange {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
}
```

### State Management

#### Current Approach (React useState)
```jsx
// Local component state
const [userTier, setUserTier] = useState('listener');
const [showModal, setShowModal] = useState(false);

// State lifting for shared data
const [characters, setCharacters] = useState([]);
```

#### Future State Management (Redux Toolkit - when needed)
```jsx
// For complex state management
import { useSelector, useDispatch } from 'react-redux';
import { setUserTier, toggleModal } from './store/userSlice';

const userTier = useSelector(state => state.user.tier);
const dispatch = useDispatch();
```

## 🔧 Configuration Files

### Vite Configuration (vite.config.js)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow external connections
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### Tailwind Configuration (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#008080',
        accent: '#FFA500',
      },
    },
  },
  plugins: [],
}
```

## 🐛 Debugging

### React Developer Tools
1. Install React Developer Tools browser extension
2. Open browser DevTools
3. Navigate to "Components" or "Profiler" tabs
4. Inspect component state and props

### Console Debugging
```jsx
// Temporary debugging (remove before commit)
console.log('User tier:', userTier);
console.log('Characters:', characters);

// Better: Use React DevTools or proper logging
```

### Network Debugging
```jsx
// Monitor API calls (future implementation)
const response = await fetch('/api/generate-audio');
console.log('API Response:', response);
```

## 🚀 Building for Production

### Production Build
```bash
# Create optimized production build
pnpm run build

# Output will be in 'dist' directory
# Files are minified and optimized for performance
```

### Build Analysis
```bash
# Analyze bundle size (when bundle analyzer is added)
pnpm run build:analyze

# Preview production build locally
pnpm run preview
```

### Performance Optimization
- **Code Splitting**: Vite automatically splits code for optimal loading
- **Tree Shaking**: Unused code is automatically removed
- **Asset Optimization**: Images and assets are optimized during build
- **CSS Purging**: Tailwind CSS removes unused styles

## 🔄 Git Workflow

### Branch Strategy
```bash
# Main development branch
git checkout main

# Feature development
git checkout -b feature/audio-player-enhancement
git checkout -b feature/user-authentication
git checkout -b fix/mobile-navigation-bug

# Commit conventions
git commit -m "feat: add audio player controls"
git commit -m "fix: resolve mobile navigation issue"
git commit -m "docs: update development setup guide"
```

### Pre-commit Hooks (future implementation)
```bash
# Install husky for git hooks
pnpm add -D husky lint-staged

# Automatically format and lint before commits
```

## 🧪 Testing Strategy (Future Implementation)

### Unit Testing with Vitest
```bash
# Install testing dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
pnpm run test
```

### Component Testing Example
```jsx
import { render, screen } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';

test('renders audio player with title', () => {
  render(<AudioPlayer title="Test Audio" />);
  expect(screen.getByText('Test Audio')).toBeInTheDocument();
});
```

## 📱 Mobile Development

### Responsive Design Testing
```bash
# Test on different screen sizes
# Chrome DevTools -> Toggle device toolbar
# Test breakpoints: 320px, 768px, 1024px, 1440px
```

### Touch Interaction Guidelines
- **Minimum touch target**: 44px × 44px
- **Thumb-friendly navigation**: Bottom tab bar
- **Swipe gestures**: Consider for audio player controls
- **Haptic feedback**: For button interactions (future)

## 🔐 Security Considerations

### Environment Variables
```bash
# Never commit sensitive data
# Use .env.local for local development
# Use proper secret management for production

# Example .env.local
VITE_API_BASE_URL=http://localhost:3000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### Content Security Policy
```html
<!-- Future implementation in index.html -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

## 🚀 Deployment

### Development Deployment
```bash
# Current deployment uses Manus platform
# Automatic deployment from main branch
# Live URL: https://bptobgcf.manus.space
```

### Production Deployment (Future)
```bash
# Vercel deployment
vercel --prod

# Netlify deployment
netlify deploy --prod

# Custom server deployment
pnpm run build
# Upload 'dist' directory to web server
```

## 📊 Performance Monitoring

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Monitoring Tools (Future)
- **Lighthouse**: Built into Chrome DevTools
- **Web Vitals Extension**: Chrome extension for real-time metrics
- **Analytics**: Google Analytics or similar for user behavior

## 🤝 Team Development

### Code Review Guidelines
1. **Functionality**: Does the code work as intended?
2. **Performance**: Are there any performance implications?
3. **Accessibility**: Is the UI accessible to all users?
4. **Mobile**: Does it work well on mobile devices?
5. **Code Quality**: Is the code clean and maintainable?

### Communication
- **Daily Standups**: Progress updates and blockers
- **Code Reviews**: All changes reviewed before merge
- **Documentation**: Keep docs updated with changes
- **Testing**: Manual testing on multiple devices

## 🆘 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
pnpm run dev -- --port 3000
```

#### Node Modules Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
pnpm run dev
```

#### Styling Issues
```bash
# Rebuild Tailwind CSS
rm -rf dist
pnpm run build
```

### Getting Help
1. **Check Documentation**: Review relevant docs in `/docs` directory
2. **Search Issues**: Look for similar issues in GitHub Issues
3. **Create Issue**: Provide detailed reproduction steps
4. **Team Chat**: Reach out to team members for urgent issues

---

**Happy coding! 🚀**

*This guide will be updated as the project evolves. Please keep it current with any changes to the development workflow.*



## 🚀 Script Editor Interface Development

### Key Features to Understand

The Script Editor Interface is the most complex component in FanCast AI. Before development, familiarize yourself with:

#### Core Components
- **ScriptEditor**: Main container with state management
- **ScriptLine**: Individual editable script lines
- **AnnotationModal**: TTS emotion annotation system
- **CharacterPanel**: Side panel for voice management
- **ActionsBar**: Bottom cost calculation and generation controls

#### State Management Patterns
```javascript
// Main script data structure
const scriptData = {
  lines: [
    {
      id: 'unique_id',
      type: 'narration|dialogue',
      speaker: 'character_id|narrator',
      text: 'editable_content',
      annotations: ['happy', 'emphatic']
    }
  ],
  characters: [
    {
      id: 'char_1',
      name: 'Character Name',
      voice: 'Voice Type'
    }
  ],
  metadata: {
    cost: 13,
    duration: 25,
    status: 'ready'
  }
};
```

### Development Workflow for Script Editor

#### 1. Component Development
```bash
# Start development server
pnpm run dev

# Navigate to Create → Start Creating → Generate Series
# This triggers the Script Editor Interface
```

#### 2. Testing Script Editor Features

**Basic Functionality**:
- Script line editing (text areas)
- Character assignment (dropdowns)
- TTS annotations (modal system)
- Cost calculation (real-time updates)

**Advanced Features**:
- Mobile responsiveness
- State persistence
- Performance with large scripts
- Accessibility compliance

#### 3. State Management Testing
```javascript
// Test script data updates
const testScriptUpdate = () => {
  // Add new script line
  // Update character assignment
  // Apply TTS annotations
  // Verify cost recalculation
};
```

### Component Architecture Guidelines

#### ScriptEditor Component Structure
```
src/
├── App.jsx (Main application with Script Editor)
├── components/ (if extracted)
│   ├── ScriptEditor/
│   │   ├── ScriptEditor.jsx
│   │   ├── ScriptLine.jsx
│   │   ├── AnnotationModal.jsx
│   │   ├── CharacterPanel.jsx
│   │   └── ActionsBar.jsx
│   └── shared/
└── styles/
    └── script-editor.css
```

#### Best Practices for Script Editor Development

**State Management**:
- Use immutable update patterns
- Implement proper cleanup in useEffect
- Optimize re-renders with React.memo
- Debounce text input updates

**Performance Optimization**:
- Virtual scrolling for large scripts
- Efficient DOM updates
- Memory leak prevention
- Mobile performance considerations

**Accessibility**:
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Touch target optimization

### Testing the Script Editor Interface

#### Manual Testing Checklist

**Basic Workflow**:
- [ ] Create → Start Creating → Add story concept
- [ ] Click "Generate Series" → Loading animation appears
- [ ] Script Editor opens with sample content
- [ ] All interactive elements are functional

**Script Line Testing**:
- [ ] Text areas are editable
- [ ] Speaker dropdowns work correctly
- [ ] Annotation buttons open modal
- [ ] Preview buttons respond to clicks
- [ ] Remove buttons clear annotations

**Character Management**:
- [ ] Character cards display correctly
- [ ] Voice preview buttons are functional
- [ ] Character assignments update in real-time

**TTS Annotation System**:
- [ ] Modal opens when clicking 🎭 buttons
- [ ] All 8 annotation types are available
- [ ] Annotations apply to correct script lines
- [ ] Annotation tags display with proper styling
- [ ] Remove functionality works correctly

**Cost Calculation**:
- [ ] Cost updates when editing script
- [ ] Duration estimate adjusts appropriately
- [ ] Generate Audio button is functional

**Mobile Responsiveness**:
- [ ] Layout adapts to mobile screens
- [ ] Touch targets are appropriately sized
- [ ] Scrolling works smoothly
- [ ] Text editing is comfortable on mobile

#### Automated Testing Setup

```bash
# Install testing dependencies (if not already included)
pnpm add -D @testing-library/react @testing-library/jest-dom vitest

# Run tests
pnpm run test
```

**Test Examples**:
```javascript
// Test Script Editor rendering
test('Script Editor renders with sample content', () => {
  render(<App />);
  // Navigate to Script Editor
  // Verify content appears
});

// Test annotation functionality
test('TTS annotations can be added and removed', () => {
  // Click annotation button
  // Select annotation type
  // Verify annotation appears
  // Test removal functionality
});
```

### Performance Monitoring

#### Key Metrics to Monitor

**Loading Performance**:
- Script Editor Interface load time
- Transition from loading state to editor
- Component rendering performance

**Interaction Performance**:
- Text input responsiveness
- Annotation modal open/close speed
- Real-time cost calculation updates

**Memory Usage**:
- State management efficiency
- Component cleanup verification
- Memory leak detection

#### Performance Testing Tools

```bash
# Browser DevTools
# - Performance tab for profiling
# - Memory tab for leak detection
# - Network tab for loading analysis

# React DevTools
# - Component profiler
# - State inspection
# - Re-render analysis
```

### Debugging Common Issues

#### Script Editor Not Loading
```javascript
// Check state management
console.log('showScriptEditor:', showScriptEditor);
console.log('isGenerating:', isGenerating);

// Verify handleGenerateSeries function
const handleGenerateSeries = () => {
  setIsGenerating(true);
  setTimeout(() => {
    setIsGenerating(false);
    setShowScriptEditor(true);
  }, 3000);
};
```

#### Annotation Modal Issues
```javascript
// Debug modal state
console.log('showAnnotationModal:', showAnnotationModal);
console.log('selectedLineId:', selectedLineId);

// Check event handling
const handleAnnotationClick = (lineId) => {
  setSelectedLineId(lineId);
  setShowAnnotationModal(true);
};
```

#### Performance Issues
```javascript
// Use React.memo for optimization
const ScriptLine = React.memo(({ line, onUpdate }) => {
  // Component implementation
});

// Debounce text updates
const debouncedText = useDebounce(text, 300);
useEffect(() => {
  onUpdate(line.id, { text: debouncedText });
}, [debouncedText]);
```

### Advanced Development Topics

#### Custom Hooks for Script Editor

```javascript
// useScriptEditor hook
const useScriptEditor = (initialScript) => {
  const [scriptData, setScriptData] = useState(initialScript);
  
  const updateLine = useCallback((lineId, updates) => {
    setScriptData(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.id === lineId ? { ...line, ...updates } : line
      )
    }));
  }, []);
  
  const addAnnotation = useCallback((lineId, annotation) => {
    // Implementation
  }, []);
  
  return { scriptData, updateLine, addAnnotation };
};
```

#### Integration with Backend APIs

```javascript
// API integration structure
const ScriptEditorAPI = {
  saveScript: async (scriptData) => {
    return await fetch('/api/scripts', {
      method: 'POST',
      body: JSON.stringify(scriptData)
    });
  },
  
  generateAudio: async (scriptData) => {
    return await fetch('/api/generate-audio', {
      method: 'POST',
      body: JSON.stringify(scriptData)
    });
  }
};
```

### Deployment Considerations

#### Build Optimization
```bash
# Production build
pnpm run build

# Verify build output
ls -la dist/

# Test production build locally
pnpm run preview
```

#### Environment Variables
```bash
# .env.local (for development)
VITE_API_BASE_URL=http://localhost:3000
VITE_TTS_API_KEY=your_development_key

# .env.production (for production)
VITE_API_BASE_URL=https://api.fancast.ai
VITE_TTS_API_KEY=your_production_key
```

---

The Script Editor Interface represents the most sophisticated component in FanCast AI. Take time to understand its architecture and state management patterns before making modifications. The component is designed for scalability and future backend integration.

