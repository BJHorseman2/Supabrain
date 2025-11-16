import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Helper to get news context
async function getNewsContext(question: string): Promise<Array<{title: string, url: string, snippet: string}>> {
  if (!process.env.NEWS_API_KEY) {
    return [];
  }

  try {
    const truncatedQuery = question.substring(0, 200);
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 2);
    const fromStr = from.toISOString().split("T")[0]; // YYYY-MM-DD

    const newsApiBase = process.env.NEWS_API_BASE || 'https://newsapi.org/v2/everything';
    const url = new URL(newsApiBase);
    url.searchParams.append('q', truncatedQuery);
    url.searchParams.append('from', fromStr);
    url.searchParams.append('sortBy', 'publishedAt');
    url.searchParams.append('language', 'en');
    url.searchParams.append('pageSize', '5');

    const response = await fetch(url.toString(), {
      headers: {
        'X-Api-Key': process.env.NEWS_API_KEY,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (data.articles && Array.isArray(data.articles)) {
      return data.articles.slice(0, 5).map((article: any) => ({
        title: article.title || '',
        url: article.url || '',
        snippet: (article.description || article.content || '').substring(0, 250),
      }));
    }

    return [];
  } catch (error) {
    console.log('News API error:', error);
    return [];
  }
}

// Helper to format news as text
function newsToText(newsItems: Array<{title: string, url: string, snippet: string}>): string {
  if (newsItems.length === 0) {
    return 'No recent news articles were fetched.';
  }

  return newsItems.map((item, index) =>
    `(${index + 1}) ${item.title}\nURL: ${item.url}\nSnippet: ${item.snippet}`
  ).join('\n\n');
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get news context
    const newsItems = await getNewsContext(message);
    const newsText = newsToText(newsItems);

    // Build enhanced prompt with news context
    const enhancedMessage = `${message}\n\nNews context (may be useful for time-sensitive questions):\n${newsText}`;

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