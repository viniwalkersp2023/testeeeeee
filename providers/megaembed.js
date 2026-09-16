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

function extractMovieId(html) {
  const match = html.match(/id="embed-player"\s+data-movie-id="([^"]+)"/);
  if (!match) {
    throw new Error('Movie ID not found');
  }
  return match[1];
}

function extractServerId(html) {
  const match = html.match(/data-id="([^"]+)"\s+class="server dropdown-item"/);
  if (!match) {
    throw new Error('Server ID not found');
  }
  return match[1];
}

async function getStreamLink(movieId, serverId) {
  const url = `${BASE_URL}/ajax/get_stream_link?id=${encodeURIComponent(serverId)}&movie=${encodeURIComponent(movieId)}&is_init=0&captcha=&ref=`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*; q=0.01'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to get stream link');
  }

  return data.data.link;
}

async function fetchAndExtract(tmdbId, mediaType, season, episode) {
  const embedUrl = buildEmbedUrl(tmdbId, mediaType, season, episode);

  const response = await fetchWithHeaders(embedUrl);
  const html = await response.text();

  const movieId = extractMovieId(html);
  const serverId = extractServerId(html);

  const streamLink = await getStreamLink(movieId, serverId);

  return [{
    name: 'MegaEmbed',
    title: 'MegaEmbed',
    url: streamLink,
    quality: 'Auto',
    type: mediaType === 'movie' ? 'movie' : 'tv',
    provider: 'megaembed',
    behaviorHints: {
      notWebReady: true,
      filename: streamLink,
      referer: BASE_URL,
      origin: BASE_URL
    }
  }];
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