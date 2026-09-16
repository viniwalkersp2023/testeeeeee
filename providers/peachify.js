const BASE_URL = 'https://peachify.top';

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

function buildEmbedUrl(tmdbId, mediaType, season, episode) {
  const id = encodeURIComponent(tmdbId);

  if (mediaType === 'movie') {
    return `${BASE_URL}/embed/movie/${id}`;
  }

  if (mediaType === 'tv') {
    if (season !== null && episode !== null) {
      return `${BASE_URL}/embed/tv/${id}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}`;
    }
    return `${BASE_URL}/embed/tv/${id}`;
  }

  throw new Error('Unsupported media type');
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    const embedUrl = buildEmbedUrl(tmdbId, mediaType, season, episode);
    const response = await fetchWithHeaders(embedUrl);
    const html = await response.text();

    const sourcesMatch = html.match(/var sources = (\[[\s\S]*?\]);/);
    if (!sourcesMatch) {
      return [];
    }

    const sources = JSON.parse(sourcesMatch[1]);
    const streams = [];

    for (const source of sources) {
      const stream = {
        name: 'Peachify',
        title: source.label || 'Peachify',
        url: source.file,
        quality: source.quality || 'Auto',
        type: mediaType === 'movie' ? 'movie' : 'tv',
        provider: 'peachify',
        behaviorHints: {
          notWebReady: true,
          filename: source.file,
          referer: BASE_URL,
          origin: BASE_URL
        }
      };

      streams.push(stream);
    }

    return streams;
  } catch (error) {
    console.error('Peachify error:', error.message || error);
    return [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else {
  globalThis.getStreams = getStreams;
  global.getStreams = getStreams;
}