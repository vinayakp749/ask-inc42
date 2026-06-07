import { load } from 'cheerio';

export interface ScrapedArticle {
  title: string;
  url: string;
  content: string;
  summary: string;
  publishedAt?: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function extractArticleContent(url: string): Promise<{ content: string; publishedAt?: string }> {
  const html = await fetchHtml(url);
  const $ = load(html);

  $('script, style, nav, header, footer, aside, .ad, .advertisement, .related-posts, .comments, .sidebar, .widget, noscript, iframe').remove();

  const selectors = ['.entry-content', '.article-body', 'article .content', 'article', 'main .post-content', 'main'];
  let content = '';
  for (const sel of selectors) {
    const text = $(sel).first().text().replace(/\s+/g, ' ').trim();
    if (text.length > 200) {
      content = text.substring(0, 5000);
      break;
    }
  }

  const publishedAt =
    $('time[datetime]').attr('datetime') ||
    $('meta[property="article:published_time"]').attr('content') ||
    undefined;

  return { content, publishedAt };
}

export async function searchInc42(query: string): Promise<ScrapedArticle[]> {
  console.log(`[scraper] Searching Inc42 for: "${query}"`);

  const searchUrl = `https://inc42.com/?s=${encodeURIComponent(query)}`;
  let html: string;

  try {
    html = await fetchHtml(searchUrl);
  } catch (err) {
    console.error('[scraper] Search fetch failed:', err);
    return [];
  }

  const $ = load(html);
  const seen = new Set<string>();
  const links: { title: string; url: string }[] = [];

  $('h2 a, h3 a, .entry-title a, .post-title a, article a[href*="inc42.com"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    const title = $(el).text().trim();
    if (
      href.startsWith('https://inc42.com/') &&
      !href.includes('?') &&
      title.length > 15 &&
      !seen.has(href)
    ) {
      seen.add(href);
      links.push({ title, url: href });
    }
  });

  console.log(`[scraper] Found ${links.length} article links`);

  const top = links.slice(0, 4);
  const settled = await Promise.allSettled(
    top.map(async (link) => {
      const { content, publishedAt } = await extractArticleContent(link.url);
      if (content.length < 100) throw new Error('Too short');
      return {
        title: link.title,
        url: link.url,
        content,
        summary: content.substring(0, 400).replace(/\s+/g, ' ') + '\u2026',
        publishedAt,
      } as ScrapedArticle;
    })
  );

  const results = settled
    .filter((r): r is PromiseFulfilledResult<ScrapedArticle> => r.status === 'fulfilled')
    .map((r) => r.value);

  console.log(`[scraper] Successfully scraped ${results.length} articles`);
  return results;
}
