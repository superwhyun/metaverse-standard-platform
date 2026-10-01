type Metadata = {
  title: string;
  description: string | null;
  image: string | null;
  source: 'metadata-service' | 'youtube-oembed' | 'url';
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

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
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

export async function getTechNewsMetadata(url: string): Promise<Metadata> {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    const [youtube, service] = await Promise.all([
      fetchYouTubeMetadata(videoId),
      fetchMetadataService(url),
    ]);
    if (youtube) {
      // oEmbed supplies a reliable video title and thumbnail. The existing
      // service can still provide the video's longer description when present.
      return {
        title: youtube.title,
        description: service?.description || youtube.description,
        image: youtube.image || service?.image || null,
        source: 'youtube-oembed',
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
