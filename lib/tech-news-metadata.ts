type Metadata = {
  title: string;
  description: string | null;
  image: string | null;
  source: 'metadata-service' | 'youtube-data-api' | 'youtube-oembed' | 'x-oembed' | 'url';
};

type MetadataServiceResponse = {
  status?: boolean;
  data?: { title?: unknown; description?: unknown; image?: unknown };
};

type YouTubeOEmbedResponse = {
  title?: unknown;
  author_name?: unknown;
  thumbnail_url?: unknown;
};

type YouTubeDataApiResponse = {
  items?: Array<{
    snippet?: {
      title?: unknown;
      description?: unknown;
      channelTitle?: unknown;
      thumbnails?: Record<string, { url?: unknown }>;
    };
  }>;
};

type XOEmbedResponse = {
  html?: unknown;
  thumbnail_url?: unknown;
};

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isGenericYouTubeDescription(description: string | null): boolean {
  if (!description) return false;
  const normalized = description.replace(/\s+/g, ' ').toLowerCase();
  return normalized.includes('youtube에서 마음에 드는 동영상과 음악을 감상하고')
    || normalized.includes('enjoy the videos and music you love, upload original content');
}

export function getYouTubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();
  let candidate: string | null = null;
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    candidate = url.pathname.split('/')[1] || null;
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') candidate = url.searchParams.get('v');
    if (['shorts', 'live', 'embed'].includes(parts[0])) candidate = parts[1] || null;
  }

  return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

export function getXPostUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].includes(url.hostname.toLowerCase())) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  const statusIndex = parts[0] === 'i' && parts[1] === 'web' ? 2 : 1;
  const username = parts[0];
  const postId = parts[statusIndex + 1];
  if (parts[statusIndex] !== 'status' || !/^[a-zA-Z0-9_]{1,15}$/.test(username) || !/^\d{1,20}$/.test(postId || '')) return null;

  // The registered oEmbed provider recognizes twitter.com status URLs.
  return `https://twitter.com/${username}/status/${postId}`;
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  };
  return text.replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (entity, value: string) => {
    if (value.startsWith('#')) {
      const hex = value[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(value.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    }
    return named[value.toLowerCase()] ?? entity;
  });
}

function xPostText(html: unknown): string | null {
  if (typeof html !== 'string') return null;
  const blockquote = html.match(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/i)?.[1];
  const paragraph = blockquote?.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  if (!paragraph) return null;

  const text = decodeHtmlEntities(paragraph
    .replace(/<img\b[^>]*\balt=(['"])(.*?)\1[^>]*>/gi, (_tag, _quote, alt: string) => alt)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*/g, '\n')
    .trim();
  return text || null;
}

async function fetchMetadataService(url: string): Promise<Omit<Metadata, 'source'> | null> {
  try {
    const endpoint = `http://xtandards.is-an.ai:3100/api/metadata?url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      console.warn('[tech-analysis] metadata service HTTP error', { httpStatus: response.status });
      return null;
    }

    const body = await response.json() as MetadataServiceResponse;
    if (!body.status || !body.data) {
      console.warn('[tech-analysis] metadata service returned no result');
      return null;
    }

    return {
      title: nonEmptyString(body.data.title) || url,
      description: nonEmptyString(body.data.description),
      image: nonEmptyString(body.data.image),
    };
  } catch (error) {
    console.warn('[tech-analysis] metadata service request failed', error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function fetchYouTubeMetadata(videoId: string): Promise<Omit<Metadata, 'source'> | null> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      console.warn('[tech-analysis] YouTube oEmbed HTTP error', { httpStatus: response.status });
      return null;
    }

    const body = await response.json() as YouTubeOEmbedResponse;
    const title = nonEmptyString(body.title);
    if (!title) {
      console.warn('[tech-analysis] YouTube oEmbed returned no title');
      return null;
    }

    const author = nonEmptyString(body.author_name);
    return {
      title,
      description: author ? `YouTube 영상 · 채널: ${author}` : 'YouTube 영상',
      image: nonEmptyString(body.thumbnail_url),
    };
  } catch (error) {
    console.warn('[tech-analysis] YouTube oEmbed request failed', error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function fetchYouTubeDataApi(videoId: string, apiKey: string): Promise<Omit<Metadata, 'source'> | null> {
  const params = new URLSearchParams({ part: 'snippet', id: videoId, key: apiKey });
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn('[tech-analysis] YouTube Data API HTTP error', { httpStatus: response.status });
      return null;
    }

    const body = await response.json() as YouTubeDataApiResponse;
    const snippet = body.items?.[0]?.snippet;
    const title = nonEmptyString(snippet?.title);
    if (!title) {
      console.warn('[tech-analysis] YouTube Data API returned no video');
      return null;
    }

    const channel = nonEmptyString(snippet?.channelTitle);
    const description = nonEmptyString(snippet?.description);
    return {
      title,
      description: description || (channel ? `YouTube 영상 · 채널: ${channel}` : 'YouTube 영상'),
      image: nonEmptyString(snippet?.thumbnails?.high?.url)
        || nonEmptyString(snippet?.thumbnails?.medium?.url)
        || nonEmptyString(snippet?.thumbnails?.default?.url),
    };
  } catch (error) {
    // Do not print the request URL: it contains the API key.
    console.warn('[tech-analysis] YouTube Data API request failed', error instanceof Error ? error.name : 'UnknownError');
    return null;
  }
}

async function fetchXMetadata(postUrl: string): Promise<Omit<Metadata, 'source'> | null> {
  const endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(postUrl)}&omit_script=1&dnt=1`;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      console.warn('[tech-analysis] X oEmbed HTTP error', { httpStatus: response.status });
      return null;
    }

    const body = await response.json() as XOEmbedResponse;
    const text = xPostText(body.html);
    if (!text) {
      console.warn('[tech-analysis] X oEmbed returned no post text');
      return null;
    }

    const firstLine = text.split('\n')[0];
    return {
      title: firstLine.length > 120 ? `${firstLine.slice(0, 119).trimEnd()}…` : firstLine,
      description: text,
      image: nonEmptyString(body.thumbnail_url),
    };
  } catch (error) {
    console.warn('[tech-analysis] X oEmbed request failed', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function getTechNewsMetadata(url: string, options: { youtubeApiKey?: string } = {}): Promise<Metadata> {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    if (options.youtubeApiKey) {
      const video = await fetchYouTubeDataApi(videoId, options.youtubeApiKey);
      if (video) return { ...video, source: 'youtube-data-api' };
    }
    const [youtube, service] = await Promise.all([
      fetchYouTubeMetadata(videoId),
      fetchMetadataService(url),
    ]);
    const serviceDescription = isGenericYouTubeDescription(service?.description || null)
      ? null
      : service?.description || null;
    if (service?.description && !serviceDescription) {
      console.warn('[tech-analysis] ignored generic YouTube site description');
    }
    if (youtube) {
      // oEmbed supplies a reliable video title and thumbnail. The existing
      // service can still provide the video's longer description when present.
      return {
        title: youtube.title,
        description: serviceDescription || youtube.description,
        image: youtube.image || service?.image || null,
        source: 'youtube-oembed',
      };
    }
    if (service) return { ...service, description: serviceDescription, source: 'metadata-service' };
    return { title: url, description: null, image: null, source: 'url' };
  }

  const xPostUrl = getXPostUrl(url);
  if (xPostUrl) {
    const [post, service] = await Promise.all([
      fetchXMetadata(xPostUrl),
      fetchMetadataService(url),
    ]);
    if (post) {
      return {
        ...post,
        image: post.image || service?.image || null,
        source: 'x-oembed',
      };
    }
    if (service) return { ...service, source: 'metadata-service' };
    return { title: url, description: null, image: null, source: 'url' };
  }

  const service = await fetchMetadataService(url);
  return service
    ? { ...service, source: 'metadata-service' }
    : { title: url, description: null, image: null, source: 'url' };
}
