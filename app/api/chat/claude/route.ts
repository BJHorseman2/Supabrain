import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
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

    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    // Get news context
    const newsItems = await getNewsContext(message);

    // Log for debugging
    console.log("WEB CONTEXT FOR QUESTION:", message, JSON.stringify(newsItems, null, 2));

    const newsText = newsToText(newsItems);

    // Build enhanced prompt with clear context for Claude
    const userContent = `
You are one of three models answering the same question side by side with web search results.

Current Information and News Context:
${newsText}

User question: ${message}

CRITICAL INSTRUCTIONS:
- You HAVE been provided with web search results above - use them to answer
- Use ONLY the information provided above for current events and specific facts
- If the web search results don't contain relevant information, explicitly say "I couldn't find specific information about that in the search results provided"
- Do NOT hallucinate or make up information that isn't in the context
- You can provide general knowledge but MUST distinguish it from the current information
- Always use the current date shown above when discussing time-sensitive topics
`.trim();

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const response = completion.content[0].type === 'text'
      ? completion.content[0].text
      : '';

    return NextResponse.json({ response, newsContext: newsItems });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Claude' },
      { status: 500 }
    );
  }
}