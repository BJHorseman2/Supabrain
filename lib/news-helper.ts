// Shared news helper functions for all API routes

export async function getNewsContext(question: string): Promise<Array<{title: string, url: string, snippet: string}>> {
  const newsItems: Array<{title: string, url: string, snippet: string}> = [];

  // Always get current date
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    // First, try NewsAPI if key is available (skip obviously fake keys)
    if (process.env.NEWS_API_KEY &&
        process.env.NEWS_API_KEY !== '2f3d4e5a6b7c8d9e0f1a2b3c4d5e6f7a' &&
        process.env.NEWS_API_KEY !== 'c4a1f1e4c4e746f7b3f3c7e8d9a2b5e3' &&
        process.env.NEWS_API_KEY.length > 20) {
      const truncatedQuery = question.substring(0, 200);
      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - 2);
      const fromStr = from.toISOString().split("T")[0];

      const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(truncatedQuery)}&from=${fromStr}&sortBy=publishedAt&language=en&pageSize=5`;

      const newsApiResponse = await fetch(newsApiUrl, {
        headers: {
          'X-Api-Key': process.env.NEWS_API_KEY,
        },
      });

      if (newsApiResponse.ok) {
        const data = await newsApiResponse.json();
        if (data.articles && Array.isArray(data.articles)) {
          return data.articles.slice(0, 5).map((article: any) => ({
            title: article.title || '',
            url: article.url || '',
            snippet: (article.description || article.content || '').substring(0, 250),
          }));
        }
      }
    }

    // Fallback: Use The Guardian API (free with 'test' key)
    const guardianUrl = `https://content.guardianapis.com/search?q=${encodeURIComponent(question.substring(0, 100))}&api-key=test&show-fields=trailText,bodyText&page-size=5&order-by=newest`;

    const guardianResponse = await fetch(guardianUrl);

    if (guardianResponse.ok) {
      const guardianData = await guardianResponse.json();

      if (guardianData.response?.results?.length > 0) {
        // Get current date for filtering
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const recentArticles = guardianData.response.results
          .filter((article: any) => {
            const pubDate = new Date(article.webPublicationDate);
            return pubDate > twoDaysAgo;
          })
          .slice(0, 5);

        if (recentArticles.length > 0) {
          return recentArticles.map((article: any) => ({
            title: article.webTitle || '',
            url: article.webUrl || '',
            snippet: article.fields?.trailText || article.fields?.bodyText?.substring(0, 250) || 'Read full article for details',
          }));
        }
      }
    }

    // Additional fallback: Add current date context at minimum
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return [{
      title: `Current Date: ${today}`,
      url: '',
      snippet: `Today is ${today}. While specific news articles couldn't be fetched, this confirms the current date for time-sensitive questions.`
    }];

  } catch (error) {
    console.log('News fetch error:', error);
    // Return date context even on error
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return [{
      title: `Current Date: ${today}`,
      url: '',
      snippet: `Today is ${today}. News sources are temporarily unavailable, but this confirms the current date.`
    }];
  }
}

export function newsToText(newsItems: Array<{title: string, url: string, snippet: string}>): string {
  // Always include current date at the beginning
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let newsText = `Today's Date: ${todayStr}\n\n`;

  if (newsItems.length === 0) {
    newsText += 'No recent news articles were fetched, but the current date has been provided above.';
  } else {
    newsText += 'Recent news (from the last 48 hours):\n\n';
    newsText += newsItems.map((item, index) => {
      if (item.url) {
        return `(${index + 1}) ${item.title}\nURL: ${item.url}\nSnippet: ${item.snippet}`;
      } else {
        return `${item.title}\n${item.snippet}`;
      }
    }).join('\n\n');
  }

  return newsText;
}