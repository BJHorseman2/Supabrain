import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get news context
    const newsItems = await getNewsContext(message);
    const newsText = newsToText(newsItems);

    // Build enhanced prompt with news context
    const enhancedMessage = `${message}\n\nNews context (may be useful for time-sensitive questions):\n${newsText}`;

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