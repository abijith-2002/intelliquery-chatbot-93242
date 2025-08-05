# IntelliQuery Chatbot Frontend

A modern, responsive React frontend for the IntelliQuery AI chatbot system. Features a clean, minimalist dark theme with card-based design and real-time chat functionality.

## 🚀 Features

- **Modern UI/UX**: Clean, minimalist design with dark/light theme toggle
- **Real-time Chat**: Seamless communication with FastAPI backend
- **Dual AI Integration**: Displays both Gemini AI and RAG responses
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Session Persistence**: Maintains conversation history across browser sessions
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Performance Optimized**: Efficient rendering and memory management

## 🎨 Design System

### Color Palette
- **Primary Background**: `#2c3e50` (Dark blue-gray)
- **Secondary Background**: `#34495e` (Lighter blue-gray)
- **Accent Color**: `#3498db` (Bright blue)
- **Text Colors**: White primary, light gray secondary, muted gray

### Typography
- **Font Family**: Inter, system fonts fallback
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Responsive sizing**: 13px-28px range with proper line heights

### Spacing System
- **XS**: 4px, **SM**: 8px, **MD**: 16px, **LG**: 24px, **XL**: 32px, **XXL**: 48px

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── Header.js/css          # App header with branding and theme toggle
│   ├── ChatMessage.js/css     # Individual message component
│   ├── ChatInput.js/css       # Message input with send functionality
│   ├── ErrorMessage.js/css    # Error display component
│   └── index.js               # Component exports
├── App.js/css                 # Main application component
├── index.js/css               # Application entry point
└── App.test.js                # Test suite
```

### Key Features

#### Header Component
- Brand identity with logo and title
- Theme toggle (dark/light)
- Responsive design

#### Chat Interface
- Message bubbles with user/assistant differentiation
- Dual response display (Gemini + RAG)
- Loading states and animations
- Auto-scroll to latest messages

#### Input System
- Auto-resizing textarea
- Character counter (2000 limit)
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Send button with loading states

#### Error Handling
- Graceful error display
- Retry functionality
- Network error recovery

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Running IntelliQuery backend (see backend documentation)

### Quick Start
```bash
# Clone and navigate to frontend directory
cd intelliquery-chatbot-93242/chatbot_frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables in .env
# REACT_APP_API_BASE_URL=http://localhost:8000

# Start development server
npm start
```

### Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:8000    # Backend API URL
REACT_APP_GEMINI_API_KEY=your_key_here         # Optional Gemini key
REACT_APP_SITE_URL=http://localhost:3000       # Site URL for redirects
REACT_APP_DEFAULT_THEME=dark                   # Default theme
```

## 📱 Usage

### Basic Chat Flow
1. Enter your question in the input field
2. Press Enter or click Send button
3. View dual responses:
   - **Gemini AI**: AI-generated comprehensive answer
   - **Knowledge Base**: RAG-retrieved relevant information
4. Continue conversation with context awareness

### Keyboard Shortcuts
- `Enter`: Send message
- `Shift + Enter`: New line in message
- `Tab`: Navigate between interactive elements

### Theme Toggle
Click the theme toggle button in the header to switch between dark and light modes. Preference is saved automatically.

## 🧪 Testing

```bash
# Run test suite
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode
CI=true npm test
```

### Test Coverage
- Component rendering
- User interactions
- API integration
- Error handling
- Theme functionality
- Local storage persistence

## 🚀 Building & Deployment

```bash
# Build for production
npm run build

# The build folder contains optimized static files ready for deployment
```

### Build Configuration
- Minification and optimization enabled
- Source maps for debugging
- Asset optimization and caching
- Bundle splitting for better performance

## 🔌 API Integration

### Backend Communication
The frontend communicates with the FastAPI backend via REST API:

```javascript
POST /chat HTTP/1.1
Content-Type: application/json

{
  "session_id": "session-abc123",
  "query": "What is machine learning?"
}
```

### Response Format
```javascript
{
  "rag_answer": "Knowledge base response...",
  "gemini_answer": "Gemini AI response...",
  "conversation_history": [...]
}
```

## 🎯 Performance Optimizations

- **Component Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: Efficient handling of long chat histories
- **Session Storage**: Optimized conversation persistence
- **Bundle Splitting**: Reduced initial load time

## ♿ Accessibility Features

- **WCAG 2.1 AA Compliance**: Proper contrast ratios and navigation
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **High Contrast Mode**: Support for system preferences
- **Reduced Motion**: Respects user motion preferences

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
- Ensure Node.js 16+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

**API Connection Issues**
- Verify backend is running on correct port
- Check REACT_APP_API_BASE_URL in .env file
- Verify CORS settings in backend

**Theme Not Persisting**
- Check browser localStorage is enabled
- Clear browser cache and localStorage

**Performance Issues**
- Clear conversation history if too long
- Check for memory leaks in browser dev tools
- Ensure backend is responding quickly

## 🔄 Updates & Maintenance

### Keeping Dependencies Updated
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Security audit
npm audit && npm audit fix
```

### Adding New Features
1. Create new component in `src/components/`
2. Add corresponding CSS file
3. Export from `src/components/index.js`
4. Import and use in parent components
5. Add tests for new functionality

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📞 Support

For technical support or questions:
- Check the troubleshooting section above
- Review backend API documentation
- Submit issues via GitHub issue tracker

---

**IntelliQuery Chatbot Frontend v1.0.0**  
Built with ❤️ using React and modern web technologies.
