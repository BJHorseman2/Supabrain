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
    const userContent = `You are one of three models answering the same question side by side.

Web context (this is the ONLY up-to-date information you can use):
${newsText}

Rules:
- If the answer is clearly in the web context, use it.
- If the web context does NOT contain the answer, say explicitly:
  "The web results I was given do not contain the answer to this question."
- Do NOT guess based on prior knowledge or older world state.

User question: ${message}`;

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