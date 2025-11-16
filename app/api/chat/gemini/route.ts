import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getNewsContext, newsToText } from '@/lib/news-helper';

// Check if question is about Tech/AI
function isTechAIQuestion(question: string): boolean {
  const q = question.toLowerCase();
  const techTerms = ['ai', 'artificial intelligence', 'openai', 'chatgpt', 'claude', 'anthropic',
                     'gemini', 'google', 'microsoft', 'nvidia', 'chip', 'semiconductor', 'gpu',
                     'llm', 'machine learning', 'tech', 'technology', 'software', 'startup',
                     'deepmind', 'meta', 'apple', 'amazon', 'model', 'neural', 'algorithm',
                     'compute', 'training', 'inference', 'transformer', 'gpt', 'api', 'cloud'];

  return techTerms.some(term => q.includes(term));
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if question is about Tech/AI
    if (!isTechAIQuestion(message)) {
      const nonTechMessage = "SUPERBRAIN is limited to Tech & AI news only. Your question doesn't appear to be about technology or AI. Please ask about today's Tech/AI news, companies, models, chips, regulations, etc.";
      return NextResponse.json({
        response: nonTechMessage,
        newsContext: []
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get news context (will be Tech/AI focused)
    const newsItems = await getNewsContext(message);

    // Log for debugging
    console.log("WEB CONTEXT FOR QUESTION:", message, JSON.stringify(newsItems, null, 2));

    const newsText = newsToText(newsItems);

    // Build enhanced prompt for Tech/AI focus
    const enhancedMessage = `You are answering a question about recent Tech & AI news only.

Web context (this is the ONLY up-to-date Tech/AI information you can use):
${newsText}

Rules:
- You are ONLY allowed to answer about Tech/AI topics
- If the answer is clearly in the web context above, summarize it
- If the web context does NOT contain the answer, say explicitly:
  "These Tech/AI news results do not mention that today."
- Do NOT guess based on prior knowledge or older information
- Focus on what's in today's tech news only

User question: ${message}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using Gemini 2.0 Flash which is available and fast
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

    const result = await model.generateContent(enhancedMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text, newsContext: newsItems });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Gemini' },
      { status: 500 }
    );
  }
}