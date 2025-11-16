import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: enhancedMessage,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    return NextResponse.json({ response, newsContext: newsItems });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from ChatGPT' },
      { status: 500 }
    );
  }
}