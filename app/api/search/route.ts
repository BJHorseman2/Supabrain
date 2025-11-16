import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Using DuckDuckGo HTML search (no API key needed)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Search request failed');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: Array<{ title: string; snippet: string; link: string }> = [];

    // Parse search results
    $('.result').each((index, element) => {
      if (index >= 5) return; // Limit to 5 results

      const title = $(element).find('.result__title').text().trim();
      const snippet = $(element).find('.result__snippet').text().trim();
      const link = $(element).find('.result__url').text().trim();

      if (title && snippet) {
        results.push({ title, snippet, link });
      }
    });

    // Format results as context
    const context = results.length > 0
      ? `Based on current web search results for "${query}":\n\n${results
          .map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\n`)
          .join('\n')}`
      : '';

    return NextResponse.json({
      results,
      context,
      searchDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}