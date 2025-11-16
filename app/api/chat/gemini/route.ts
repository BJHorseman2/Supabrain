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
    const enhancedMessage = `You are one of three models answering the same question side by side.

Web context (this is the ONLY up-to-date information you can use):
${newsText}

Rules:
- If the answer is clearly in the web context, use it.
- If the web context does NOT contain the answer, say explicitly:
  "The web results I was given do not contain the answer to this question."
- Do NOT guess based on prior knowledge or older world state.

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