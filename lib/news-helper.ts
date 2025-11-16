// Shared news helper functions for all API routes

export async function getNewsContext(question: string): Promise<Array<{title: string, url: string, snippet: string}>> {
  const newsItems: Array<{title: string, url: string, snippet: string}> = [];

  try {
    // Compute how many days back to search based on question content
    const qLower = question.toLowerCase();

    let daysBack = 2; // default
    if (qLower.includes("weekend") || qLower.includes("this weekend") ||
        qLower.includes("this week") || qLower.includes("last week")) {
      daysBack = 7;
    }

    // Always focus on Tech/AI for this app
    const isTechTodayQuestion = true; // Always use tech-focused search

    // First, try Brave Search API if key is available
    if (process.env.BRAVE_SEARCH_API_KEY &&
        process.env.BRAVE_SEARCH_API_KEY.length > 20) {

      // Build tech/AI-focused query
      const userQuery = question.substring(0, 100);
      const techTerms = "(AI OR artificial intelligence OR OpenAI OR ChatGPT OR Claude OR Anthropic OR Google Gemini OR Microsoft OR Nvidia OR chip OR semiconductor OR GPU OR LLM OR machine learning OR tech OR technology)";
      const combinedQuery = `${userQuery} ${techTerms}`;

      // Use Brave's freshness parameter for recent results
      // pd = publish date: pd1 (24h), pd3 (3 days), pw (past week), pm (past month)
      let freshness = 'pd3'; // default to 3 days
      if (daysBack <= 1) {
        freshness = 'pd1';
      } else if (daysBack >= 7) {
        freshness = 'pw';
      }

      // Constrain to news results with tech focus
      const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(combinedQuery)}&freshness=${freshness}&result_filter=news&count=10`;

      const braveResponse = await fetch(braveUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
        },
      });

      if (braveResponse.ok) {
        const data = await braveResponse.json();
        if (data.web && data.web.results && Array.isArray(data.web.results)) {
          // Filter for tech/AI related results and recent dates
          const techKeywords = ['ai', 'artificial intelligence', 'openai', 'chatgpt', 'claude', 'anthropic',
                               'gemini', 'google', 'microsoft', 'nvidia', 'chip', 'semiconductor', 'gpu',
                               'llm', 'machine learning', 'tech', 'technology', 'software', 'startup',
                               'deepmind', 'meta', 'apple', 'amazon', 'model', 'neural', 'algorithm'];

          const filteredResults = data.web.results.filter((result: any) => {
            const titleLower = (result.title || '').toLowerCase();
            const descLower = (result.description || '').toLowerCase();
            return techKeywords.some(keyword =>
              titleLower.includes(keyword) || descLower.includes(keyword)
            );
          });

          return filteredResults.slice(0, 5).map((result: any) => ({
            title: result.title || '',
            url: result.url || '',
            snippet: (result.description || '').substring(0, 250),
          }));
        }
      }
    }

    // Fallback: Use The Guardian API (free with 'test' key)
    let guardianUrl: string;

    // Always use tech-focused search for this app
    // Add date range to get recent articles
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - daysBack);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    // Tech news: combine user question with tech terms
    const userQuery = question.substring(0, 100);
    const techQuery = `${userQuery} (AI OR OpenAI OR ChatGPT OR Claude OR Anthropic OR Gemini OR Google OR Microsoft OR Nvidia OR chip OR semiconductor OR GPU OR LLM OR machine learning OR tech OR technology OR software OR startup)`;

    // Include from-date parameter for recency
    guardianUrl = `https://content.guardianapis.com/search?q=${encodeURIComponent(techQuery)}&section=technology&from-date=${fromDateStr}&api-key=test&show-fields=trailText,bodyText&page-size=15&order-by=newest`;

    const guardianResponse = await fetch(guardianUrl);

    if (guardianResponse.ok) {
      const guardianData = await guardianResponse.json();

      if (guardianData.response?.results?.length > 0) {
        // Filter to ensure we get tech-related articles
        const techKeywords = ['ai', 'artificial intelligence', 'openai', 'chatgpt', 'claude', 'anthropic',
                             'gemini', 'google', 'microsoft', 'nvidia', 'chip', 'semiconductor', 'gpu',
                             'llm', 'machine learning', 'tech', 'technology', 'software', 'startup',
                             'deepmind', 'meta', 'apple', 'amazon', 'model', 'neural', 'algorithm'];

        const filteredArticles = guardianData.response.results.filter((article: any) => {
          const title = (article.webTitle || '').toLowerCase();
          const snippet = (article.fields?.trailText || article.fields?.bodyText || '').toLowerCase();
          return techKeywords.some(keyword => title.includes(keyword) || snippet.includes(keyword));
        });

        if (filteredArticles.length > 0) {
          return filteredArticles.slice(0, 5).map((article: any) => ({
            title: article.webTitle || '',
            url: article.webUrl || '',
            snippet: article.fields?.trailText || article.fields?.bodyText?.substring(0, 250) || 'Read full article for details',
          }));
        }
      }
    }

    // Additional fallback: Add current date context at minimum
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return [{
      title: `Current Date: ${currentDate}`,
      url: '',
      snippet: `Today is ${currentDate}. While specific news articles couldn't be fetched, this confirms the current date for time-sensitive questions.`
    }];

  } catch (error) {
    console.log('News fetch error:', error);
    // Return date context even on error
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return [{
      title: `Current Date: ${currentDate}`,
      url: '',
      snippet: `Today is ${currentDate}. News sources are temporarily unavailable, but this confirms the current date.`
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