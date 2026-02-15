# Contributing to FanCast AI

Thank you for your interest in contributing to FanCast AI! This document provides guidelines and information for contributors.

## 🎯 Project Vision

FanCast AI aims to revolutionize fanfiction consumption by transforming written stories into immersive audio drama experiences. We're building a platform that serves both content consumers and creators with professional-grade tools and an exceptional user experience.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Implement features, fix bugs, or improve performance
- **Documentation**: Improve or expand our documentation
- **Design**: UI/UX improvements and design suggestions
- **Testing**: Help test new features and report issues

### Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/fancast-ai.git
   cd fancast-ai
   ```

2. **Set Up Development Environment**
   ```bash
   pnpm install
   pnpm run dev
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Guidelines

### Code Style

#### JavaScript/React
- Use functional components with hooks
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

```jsx
/**
 * AudioPlayer component for FanCast AI
 * @param {Object} props - Component props
 * @param {string} props.title - Audio title
 * @param {Function} props.onPlay - Play callback
 */
const AudioPlayer = ({ title, onPlay }) => {
  // Component implementation
};
```

#### CSS/Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing using Tailwind's spacing scale
- Use CSS variables for brand colors

```jsx
// ✅ Good: Organized utility classes
<div className="
  flex items-center justify-between
  bg-slate-800 border border-slate-700
  rounded-lg p-6 mb-4
  hover:bg-slate-700 transition-colors
">

// ❌ Avoid: Unorganized long class strings
<div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-6 mb-4 hover:bg-slate-700 transition-colors">
```

### Commit Guidelines

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(audio): add volume control to mini player
fix(navigation): resolve mobile tab switching issue
docs(readme): update installation instructions
style(components): improve button hover states
```

### Pull Request Process

1. **Before Submitting**
   - Ensure your code follows the style guidelines
   - Test your changes thoroughly
   - Update documentation if necessary
   - Add or update tests for new features

2. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement

   ## Testing
   - [ ] Tested on mobile devices
   - [ ] Tested on desktop browsers
   - [ ] Added/updated tests

   ## Screenshots (if applicable)
   Add screenshots for UI changes
   ```

3. **Review Process**
   - All PRs require at least one review
   - Address feedback promptly
   - Keep PRs focused and reasonably sized
   - Rebase and squash commits when requested

## 🐛 Bug Reports

### Before Reporting
- Check existing issues to avoid duplicates
- Test with the latest version
- Try to reproduce the issue consistently

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- Device: [e.g., iPhone 12, Desktop]
- Browser: [e.g., Chrome 96, Safari 15]
- Screen Size: [e.g., 375x667, 1920x1080]

## Screenshots
Add screenshots if applicable
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Any other context, mockups, or examples
```

## 🎨 Design Contributions

### Design Guidelines
- Follow the existing design system
- Maintain brand consistency (teal/orange color scheme)
- Ensure accessibility (WCAG 2.1 AA compliance)
- Design for mobile-first experience
- Consider dark theme compatibility

### Design Assets
- Use Figma for design mockups
- Export assets in appropriate formats (SVG for icons, WebP for images)
- Follow naming conventions for assets
- Provide multiple screen size variations

## 🧪 Testing

### Manual Testing
- Test on multiple devices and browsers
- Verify responsive design at different screen sizes
- Test accessibility with screen readers
- Validate user flows and interactions

### Automated Testing (Future)
```bash
# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run E2E tests
pnpm run test:e2e
```

## 📚 Documentation

### Documentation Standards
- Use clear, concise language
- Include code examples where appropriate
- Keep documentation up-to-date with code changes
- Follow markdown formatting guidelines

### Types of Documentation
- **README**: Project overview and quick start
- **API Documentation**: Function and component documentation
- **User Guides**: Feature usage instructions
- **Developer Guides**: Technical implementation details

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] Update version number
- [ ] Update CHANGELOG.md
- [ ] Test all features thoroughly
- [ ] Update documentation
- [ ] Create release notes
- [ ] Tag release in Git

## 🌟 Recognition

### Contributors
All contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special recognition for major features or improvements

### Contribution Types
- 💻 Code contributions
- 📖 Documentation improvements
- 🎨 Design contributions
- 🐛 Bug reports and testing
- 💡 Feature suggestions
- 🌍 Translation and localization

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussion
- **Email**: contact@fancast.ai for private inquiries

### Development Support
- Check existing documentation in `/docs` directory
- Review code comments and JSDoc documentation
- Ask questions in GitHub Discussions
- Reach out to maintainers for complex issues

## 📋 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or trolling
- Spam or off-topic content
- Sharing private information without permission

### Enforcement
Community leaders will enforce these standards fairly and consistently. Violations may result in temporary or permanent bans from the project.

## 🎯 Roadmap Alignment

### Current Priorities
1. **Core Platform Stability**: Bug fixes and performance improvements
2. **Backend Integration**: API development and data persistence
3. **Advanced Features**: Script editor and enhanced audio controls
4. **Mobile App**: React Native implementation
5. **Community Features**: Social sharing and creator tools

### Long-term Vision
- **Enterprise Features**: Advanced analytics and collaboration tools
- **AI Enhancements**: Improved voice synthesis and story generation
- **International Expansion**: Multi-language support
- **Platform Integrations**: Third-party service integrations

## 🙏 Thank You

Thank you for contributing to FanCast AI! Your contributions help make fanfiction more accessible and enjoyable for everyone. Together, we're building the future of audio storytelling.

---

**Questions?** Feel free to reach out through any of our communication channels. We're here to help!

*Last updated: January 2025*

