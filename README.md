# 🧠 Superbrain

Compare AI responses from ChatGPT, Gemini, and Claude side by side in a beautiful, modern interface featuring a three-way AI comparison.

## Features

- **Triple AI Responses**: Get simultaneous responses from ChatGPT, Gemini, and Claude
- **Three-Way Comparison**: Easily compare how different AI models answer the same question
- **Modern UI**: Beautiful gradient design with glassmorphism effects
- **Real-time Loading States**: Visual feedback while waiting for responses
- **Keyboard Shortcuts**: Press Enter to submit questions quickly

## Setup

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (for ChatGPT)
- Google AI Studio API key (for Gemini)

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd superbrain
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API keys:
   - Copy `.env.local` and add your API keys:
   ```bash
   # Edit .env.local and add your keys:
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   CLAUDE_API_KEY=your_claude_api_key_here
   ```

### Getting API Keys

#### OpenAI (ChatGPT)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key
5. Copy and paste into `.env.local`

#### Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy and paste into `.env.local`

#### Anthropic Claude
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Create a new API key
5. Copy and paste into `.env.local`

## Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your question in the text area
2. Click "Ask Both AIs" or press Enter
3. Watch as both ChatGPT and Gemini process your question
4. Compare the responses side by side

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI SDK** - ChatGPT integration
- **Google Generative AI** - Gemini integration
- **Anthropic SDK** - Claude integration

## Project Structure

```
superbrain/
├── app/
│   ├── api/
│   │   └── chat/
│   │       ├── openai/
│   │       │   └── route.ts    # ChatGPT API endpoint
│   │       ├── gemini/
│   │       │   └── route.ts    # Gemini API endpoint
│   │       └── claude/
│   │           └── route.ts    # Claude API endpoint
│   ├── page.tsx                # Main UI component
│   └── layout.tsx              # App layout
├── public/                     # Static assets
├── .env.local                  # API keys (not in git)
└── package.json               # Dependencies
```

## Troubleshooting

### API Key Errors
- Make sure your API keys are correctly added to `.env.local`
- Verify your OpenAI account has credits available
- Check that Gemini API is enabled in Google AI Studio

### CORS Issues
- The app runs API calls through Next.js API routes to avoid CORS
- Make sure you're accessing the app through `localhost:3000`

### Rate Limiting
- Both APIs have rate limits
- If you hit limits, wait a moment before trying again
- Consider upgrading your API plan for higher limits

## Future Enhancements

- Add more AI models (Llama, Cohere, etc.)
- Save conversation history
- Export responses
- Add response voting/comparison metrics
- Implement response streaming
- Add dark/light theme toggle
- Add response time tracking
- Implement prompt templates

## License

MIT