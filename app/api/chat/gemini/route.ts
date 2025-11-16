import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getNewsContext, newsToText } from '@/lib/news-helper';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get news context
    const newsItems = await getNewsContext(message);

    // Log for debugging
    console.log("WEB CONTEXT FOR QUESTION:", message, JSON.stringify(newsItems, null, 2));

    const newsText = newsToText(newsItems);

    // Build enhanced prompt with stronger guidance
    const enhancedMessage = `You are answering a question with web search results provided.

Current Information and News Context:
${newsText}

User question: ${message}

IMPORTANT INSTRUCTIONS:
- Use ONLY the information provided above to answer the question
- If the web search results don't contain relevant information, say "I couldn't find specific information about that in the current search results"
- Do NOT make up or guess information that isn't in the provided context
- You can provide general knowledge but clearly distinguish it from current information
- Always reference the current date provided above when discussing time-sensitive topics`;

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