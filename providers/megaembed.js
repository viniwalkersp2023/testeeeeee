const BASE_URL = 'https://mgeb.top';

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

async function buildStreams(sources, referer) {
  const streams = [];

  for (const source of sources) {
    const quality = await getQuality(source.file, {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      'Referer': referer,
      'Origin': referer
    });

    const stream = {
      name: 'MegaEmbed',
      title: `1080p (${source.label})`,
      url: source.file,
      quality: quality >= 1080 ? '1080p' : quality >= 720 ? '720p' : quality >= 480 ? '480p' : 'Auto',
      type: source.type,
      provider: 'megaembed',
      behaviorHints: {
        notWebReady: true,
        filename: source.file,
        referer: referer,
        origin: referer
      }
    };

    streams.push(stream);
  }

  return streams;
}

async function fetchAndExtract(tmdbId, mediaType, season, episode) {
  let embedUrl;

  if (mediaType === 'movie') {
    embedUrl = `${BASE_URL}/embed/${tmdbId}`;
  } else if (mediaType === 'tv') {
    if (season === null || episode === null) {
      throw new Error('Season and episode are required for TV shows');
    }
    embedUrl = `${BASE_URL}/embed/${tmdbId}/${season}/${episode}`;
  } else {
    throw new Error('Unsupported media type');
  }

  const response = await fetchWithHeaders(embedUrl);
  const html = await response.text();

  const sourcesMatch = html.match(/var sources = (\[[\s\S]*?\]);/);
  if (!sourcesMatch) {
    throw new Error('Sources script not found');
  }

  const sourcesJson = sourcesMatch[1];
  const sources = JSON.parse(sourcesJson);

  return buildStreams(sources, embedUrl);
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