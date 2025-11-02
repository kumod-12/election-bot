# 🗳️ ElectionSathi

**Election insights, simplified** - AI-powered Bihar election information chatbot

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/electionsathi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

### 🤖 AI-Powered Chatbot
- **Intelligent responses** using GPT-4o-mini or Claude AI
- **Context-aware conversations** with election data integration
- **Natural language processing** for voter queries

### 📊 Comprehensive Election Data
- **Party performance** analysis (2010-2020)
- **Constituency-wise details** for all 243 Bihar seats
- **Voter turnout statistics** with demographic breakdowns
- **Winner analysis** with margins and vote shares
- **Alliance performance** by region
- **Election schedule** with phase-wise information

### 🎯 Embedding & Integration
- **Embeddable widget** for any website
- **Customizable appearance** (themes, positions, sizes)
- **Analytics tracking** for usage insights
- **Cross-domain compatibility**

### 🔒 Security & Performance
- **Environment-based API key management**
- **Optimized bundle size** (reduced by 40%)
- **Static hosting** with global CDN
- **Mobile-responsive** design

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript
- **AI APIs:** OpenAI GPT-4o-mini, Anthropic Claude
- **Data Processing:** XLSX.js, PapaParse
- **Deployment:** Vercel, Static Hosting
- **Analytics:** Custom tracking system
- **UI:** Lucide React icons, Custom CSS

## 📁 Project Structure

```
electionsathi/
├── 📂 public/
│   ├── 📂 data/                    # Election data (JSON)
│   ├── 📂 raw-data/               # Source Excel files
│   ├── embed.js                   # Embeddable widget script
│   └── manifest.json              # PWA configuration
├── 📂 src/
│   ├── 📂 components/             # React components
│   ├── 📂 utils/                  # Utilities (DataLoader, Analytics)
│   ├── ElectionChatbot.tsx        # Main chatbot interface
│   ├── ElectionWidget.tsx         # Embeddable widget
│   └── App.tsx                    # Application root
├── 📂 scripts/
│   └── convertRawData.js          # Data conversion utility
├── vercel.json                    # Vercel deployment config
├── .env.example                   # Environment variables template
└── DEPLOYMENT.md                  # Deployment guide
```

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/electionsathi.git
cd electionsathi
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Add your AI API key to `.env`:
```env
REACT_APP_OPENAI_API_KEY=your_openai_key_here
REACT_APP_OPENAI_MODEL=gpt-4o-mini
```

### 3. Start Development
```bash
npm start
```

Visit `http://localhost:3000` to see the app running.

### 4. Build for Production
```bash
npm run build
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Other Platforms
- **Netlify:** Works with build folder
- **AWS S3:** Static hosting with CloudFront
- **GitHub Pages:** For public repositories

## 🔧 Configuration

### Environment Variables
```env
# AI Configuration
REACT_APP_OPENAI_API_KEY=your_key
REACT_APP_OPENAI_MODEL=gpt-4o-mini

# Alternative: Use Claude
REACT_APP_CLAUDE_API_KEY=your_claude_key
REACT_APP_CLAUDE_MODEL=claude-3-sonnet-20240229

# App Settings
REACT_APP_APP_NAME=ElectionSathi
GENERATE_SOURCEMAP=false
```

### Widget Embedding
```html
<script>
  window.ElectionSathi = {
    position: 'bottom-right',
    theme: 'light'
  };
</script>
<script src="https://your-domain.vercel.app/embed.js"></script>
```

## 📊 Data Sources

- **Election Commission of India** - Official election data
- **Bihar State Election Data** - Constituency details
- **Voter turnout statistics** - Demographic analysis
- **Party performance data** - Historical trends (2010-2020)

## 🔄 Data Updates

To update election data:

1. **Add raw files** to `public/raw-data/`
2. **Run conversion script:**
   ```bash
   node scripts/convertRawData.js
   ```
3. **Verify data** in `public/data/` folder
4. **Deploy updates**

## 🧪 Development

### Available Scripts
```bash
npm start          # Development server
npm run build      # Production build
npm run deploy     # Build for deployment
npm run analyze    # Bundle size analysis
```

### Adding New Features
1. Create feature branch
2. Implement changes
3. Test locally
4. Create pull request
5. Auto-deploy on merge

## 📈 Analytics

### Built-in Tracking
- User interactions
- Message exchanges
- Widget usage
- Performance metrics
- Error logging

### Custom Events
```javascript
// Track custom events
Analytics.track('custom_event', {
  property: 'value'
});
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Overview](./docs/workflow-diagram.html)

### Common Issues
- **Build fails:** Clear node_modules and reinstall
- **API not working:** Check environment variables
- **Widget not loading:** Verify CORS configuration

### Contact
- **Issues:** GitHub Issues
- **Features:** GitHub Discussions
- **Email:** support@electionsathi.com

## 🎯 Roadmap

### Current Version (1.0.0)
- ✅ Bihar election data integration
- ✅ AI-powered chatbot
- ✅ Embeddable widget
- ✅ Vercel deployment

### Planned Features
- 🔄 Multi-state election support
- 🔄 Real-time election updates
- 🔄 Advanced analytics dashboard
- 🔄 Mobile app version
- 🔄 Multilingual support (Hindi, Bengali)

## 🌟 Acknowledgments

- Election Commission of India for data
- OpenAI for GPT-4o-mini API
- Anthropic for Claude API
- Vercel for hosting platform
- React community for framework

---

**Built with ❤️ for democracy and informed voting**

[![ElectionSathi](https://img.shields.io/badge/ElectionSathi-Election%20insights%2C%20simplified-blue)](https://your-domain.vercel.app)