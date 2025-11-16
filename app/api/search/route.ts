import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Using Brave Search API - Free tier (2000 queries/month)
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY || 'BSAl90cqKJH_yOMxJaMbiQd9AxISi7w';

    try {
      const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;

      const response = await fetch(braveUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': braveApiKey
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Extract web results
        if (data.web && data.web.results && data.web.results.length > 0) {
          const context = `Current web search results for "${query}" (${new Date().toLocaleDateString()}):

${data.web.results.map((result: any, i: number) =>
  `${i + 1}. ${result.title}
   URL: ${result.url}
   ${result.description}
`).join('\n')}

Based on these current search results, here's the response:`;

          return NextResponse.json({
            results: data.web.results,
            context,
            searchDate: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.log('Brave Search failed:', error);
    }

    // Fallback context if search fails
    const currentDate = new Date();
    const context = `Context: User is asking about "${query}" on ${currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}.

Please provide your best available information on this topic.`;

    return NextResponse.json({
      results: [],
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