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

    // Multiple search strategies to ensure we get current information
    let context = '';
    let results: any[] = [];

    // Strategy 1: Try Wikipedia Current Events for general current info
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/Portal:Current_events`;
      const wikiResponse = await fetch(wikiUrl);

      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        if (wikiData.extract) {
          const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Add current date context
          context = `Today's Date: ${today}

Important: This is the actual current date. Please provide information that is accurate as of this date.

`;
        }
      }
    } catch (error) {
      console.log('Wikipedia fetch failed:', error);
    }

    // Strategy 2: Try to get RSS feeds from major news sources (no API key needed)
    const rssFeeds = [
      {
        name: 'BBC News',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
      }
    ];

    for (const feed of rssFeeds) {
      try {
        const response = await fetch(feed.url);
        if (response.ok) {
          const text = await response.text();

          // Parse basic info from RSS (simplified parsing)
          const titleMatches = text.match(/<title>(.*?)<\/title>/gi);
          const linkMatches = text.match(/<link>(.*?)<\/link>/gi);
          const descMatches = text.match(/<description>(.*?)<\/description>/gi);

          if (titleMatches && titleMatches.length > 2) {
            const newsItems = [];
            for (let i = 2; i < Math.min(7, titleMatches.length); i++) {
              const title = titleMatches[i]?.replace(/<\/?title>/gi, '').replace(/<!\[CDATA\[|\]\]>/g, '');
              const desc = descMatches?.[i]?.replace(/<\/?description>/gi, '').replace(/<!\[CDATA\[|\]\]>/g, '') || '';

              if (title && !title.includes('Google News')) {
                newsItems.push({
                  title: title.substring(0, 200),
                  description: desc.substring(0, 300)
                });
              }
            }

            if (newsItems.length > 0) {
              context += `Current news related to "${query}":

${newsItems.map((item, i) =>
  `${i + 1}. ${item.title}
   ${item.description ? item.description : ''}`
).join('\n\n')}

Based on this current information, here's the analysis:`;

              results = newsItems;
              break;
            }
          }
        }
      } catch (error) {
        console.log('RSS fetch failed:', error);
      }
    }

    // If no news found, provide clear current date context
    if (!context || results.length === 0) {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const currentTime = currentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short'
      });

      context = `Current Date and Time: ${formattedDate} at ${currentTime}

IMPORTANT: You are being asked about "${query}". Today's date is ${formattedDate}. Please ensure your response reflects information that would be current as of this date. If you're asked about recent events, news, or current information, acknowledge that your training data may not include the very latest updates but provide the most recent information you have available.

Note: For real-time information, consider that:
- Today is ${currentDate.toDateString()}
- The year is ${currentDate.getFullYear()}
- The month is ${currentDate.toLocaleString('en-US', { month: 'long' })}

Please provide your response with this temporal context in mind:`;
    }

    return NextResponse.json({
      results,
      context,
      searchDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);

    // Even on error, provide date context
    const currentDate = new Date();
    const context = `Today's Date: ${currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}

Please provide information about "${request.json().then(d => d.query).catch(() => 'the topic')}" with awareness of the current date.`;

    return NextResponse.json({
      results: [],
      context,
      searchDate: new Date().toISOString()
    });
  }
}