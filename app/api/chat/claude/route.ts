import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
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

    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    // Get news context (will be Tech/AI focused)
    const newsItems = await getNewsContext(message);

    // Log for debugging
    console.log("WEB CONTEXT FOR QUESTION:", message, JSON.stringify(newsItems, null, 2));

    const newsText = newsToText(newsItems);

    // Build enhanced prompt for Tech/AI focus
    const userContent = `You are answering a question about recent Tech & AI news only.

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