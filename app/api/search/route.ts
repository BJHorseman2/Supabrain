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

    let context = '';
    let results: any[] = [];

    // Get current date for context
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 1. Try The Guardian API first (free, works with 'test' key, provides current news)
    try {
      const guardianUrl = `https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&api-key=test&show-fields=headline,trailText&page-size=10&order-by=newest`;

      const guardianResponse = await fetch(guardianUrl);

      if (guardianResponse.ok) {
        const guardianData = await guardianResponse.json();

        if (guardianData.response && guardianData.response.results && guardianData.response.results.length > 0) {
          // Filter for only very recent articles (last 48 hours)
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

          const recentArticles = guardianData.response.results.filter((article: any) => {
            const pubDate = new Date(article.webPublicationDate);
            return pubDate > twoDaysAgo;
          });

          if (recentArticles.length > 0) {
            context = `Current Information (${formattedDate}):

Latest news about "${query}" from the past 48 hours:

${recentArticles.slice(0, 5).map((article: any, i: number) => {
  const pubDate = new Date(article.webPublicationDate);
  const timeDiff = currentDate.getTime() - pubDate.getTime();
  const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
  let timeString: string;

  if (hoursAgo < 1) {
    timeString = 'Just published';
  } else if (hoursAgo === 1) {
    timeString = '1 hour ago';
  } else if (hoursAgo < 24) {
    timeString = `${hoursAgo} hours ago`;
  } else {
    const daysAgo = Math.floor(hoursAgo / 24);
    timeString = daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
  }

  return `${i + 1}. ${article.webTitle}
   Source: The Guardian (${timeString})
   ${article.fields?.trailText || 'Click for full article'}
   URL: ${article.webUrl}`;
}).join('\n\n')}

Based on this current information:`;

            results = recentArticles;
          }
        }
      }
    } catch (error) {
      console.log('Guardian API failed:', error);
    }

    // 2. If no Guardian results, try Hacker News for tech topics
    if (!results.length) {
      try {
        const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`;

        const hnResponse = await fetch(hnUrl);

        if (hnResponse.ok) {
          const hnData = await hnResponse.json();

          if (hnData.hits && hnData.hits.length > 0) {
            // Filter for recent HN stories (last 48 hours for more current content)
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            const recentHN = hnData.hits.filter((hit: any) => {
              const storyDate = new Date(hit.created_at);
              return storyDate > twoDaysAgo;
            });

            if (recentHN.length > 0) {
              context = `Current Information (${formattedDate}):

Recent discussions about "${query}" from the tech community:

${recentHN.slice(0, 5).map((hit: any, i: number) => {
  const storyDate = new Date(hit.created_at);
  const timeDiff = currentDate.getTime() - storyDate.getTime();
  const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
  let timeString: string;

  if (hoursAgo < 1) {
    timeString = 'Just posted';
  } else if (hoursAgo === 1) {
    timeString = '1 hour ago';
  } else if (hoursAgo < 24) {
    timeString = `${hoursAgo} hours ago`;
  } else {
    const daysAgo = Math.floor(hoursAgo / 24);
    timeString = daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
  }

  return `${i + 1}. ${hit.title}
   Source: ${hit.author} on Hacker News (${timeString})
   Points: ${hit.points} | Comments: ${hit.num_comments}
   ${hit.url ? `URL: ${hit.url}` : `Discussion: https://news.ycombinator.com/item?id=${hit.objectID}`}`;
}).join('\n\n')}

Based on these recent tech discussions:`;

              results = recentHN;
            }
          }
        }
      } catch (error) {
        console.log('HackerNews API failed:', error);
      }
    }

    // 3. Try Wikipedia for current events context
    if (!results.length) {
      try {
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`;
        const wikiResponse = await fetch(wikiUrl);

        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          if (wikiData.extract) {
            context = `Current Date: ${formattedDate}

Information about "${query}":

${wikiData.extract}

Source: Wikipedia
URL: ${wikiData.content_urls?.desktop?.page || ''}

Please note this is reference information. For current events and recent developments as of ${formattedDate}, here's the analysis:`;

            results = [{ title: wikiData.title, extract: wikiData.extract }];
          }
        }
      } catch (error) {
        console.log('Wikipedia fetch failed:', error);
      }
    }

    // Always provide date context even if no specific results found
    if (!context || results.length === 0) {
      context = `Current Date: ${formattedDate}

IMPORTANT: This is today's actual date - ${formattedDate}.

You are being asked about "${query}". While I don't have specific recent news articles to share about this exact topic right now, please provide your response with full awareness that today is ${formattedDate}.

When discussing any events, trends, or information:
- Reference the current date (${formattedDate})
- Note if information might be from your training data vs current
- For recent events, acknowledge the timeframe appropriately

Please respond with this temporal context:`;
    }

    return NextResponse.json({
      results,
      context,
      searchDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const context = `Today's Date: ${formattedDate}

Please provide information about the requested topic with awareness that today is ${formattedDate}.`;

    return NextResponse.json({
      results: [],
      context,
      searchDate: new Date().toISOString()
    });
  }
}