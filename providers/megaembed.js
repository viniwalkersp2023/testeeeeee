const BASE_URL = 'https://megaembedapi.site';

async function fetchWithHeaders(url, headers = {}) {
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  };

  const mergedHeaders = { ...defaultHeaders, ...headers };

  const response = await fetch(url, {
    headers: mergedHeaders,
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

async function getQuality(url, headers) {
  try {
    const response = await fetchWithHeaders(url, headers);
    const text = await response.text();
    const match = text.match(/#EXT-X-STREAM-INF:[^\n]*RESOLUTION=\d+x(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 0;
  } catch {
    return 0;
  }
}

function buildEmbedUrl(tmdbId, mediaType, season, episode) {
  const id = encodeURIComponent(tmdbId);

  if (mediaType === 'movie') {
    return `${BASE_URL}/embed/${id}`;
  }

  if (mediaType === 'tv') {
    if (season !== null && episode !== null) {
      return `${BASE_URL}/embed/${id}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}`;
    }
    return `${BASE_URL}/embed/${id}`;
  }

  throw new Error('Unsupported media type');
}

async function buildStreams(html, embedUrl) {
  const sourcesMatch = html.match(/var sources = (\[[\s\S]*?\]);/);
  if (!sourcesMatch) {
    throw new Error('Sources script not found');
  }

  const sources = JSON.parse(sourcesMatch[1]);
  const streams = [];

  for (const source of sources) {
    const quality = await getQuality(source.file, {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      'Referer': embedUrl,
      'Origin': BASE_URL
    });

    const stream = {
      name: 'MegaEmbed',
      title: `${quality >= 1080 ? '1080p' : quality >= 720 ? '720p' : quality >= 480 ? '480p' : 'Auto'} (${source.label || 'server'})`,
      url: source.file,
      quality: quality >= 1080 ? '1080p' : quality >= 720 ? '720p' : quality >= 480 ? '480p' : 'Auto',
      type: source.type,
      provider: 'megaembed',
      behaviorHints: {
        notWebReady: true,
        filename: source.file,
        referer: embedUrl,
        origin: BASE_URL
      }
    };

    streams.push(stream);
  }

  return streams;
}

async function fetchAndExtract(tmdbId, mediaType, season, episode) {
  const embedUrl = buildEmbedUrl(tmdbId, mediaType, season, episode);
  const response = await fetchWithHeaders(embedUrl);
  const html = await response.text();
  return buildStreams(html, embedUrl);
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    return await fetchAndExtract(tmdbId, mediaType, season, episode);
  } catch (error) {
    console.error('MegaEmbed error:', error.message || error);
    return [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else {
  globalThis.getStreams = getStreams;
  global.getStreams = getStreams;
}