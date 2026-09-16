const BASE_URL = 'https://megaembedapi.site';

async function fetchWithHeaders(url, headers = {}) {
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
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
    if (response.status === 404) {
      throw new Error('Content not found (404)');
    }
    if (response.status === 403) {
      throw new Error('Access forbidden (403)');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded (429)');
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

function buildEmbedUrl(tmdbId, mediaType, season, episode) {
  const id = encodeURIComponent(tmdbId);

  if (mediaType === 'movie') {
    return `${BASE_URL}/embed/movie?tmdb=${id}`;
  }

  if (mediaType === 'tv') {
    if (season !== null && episode !== null) {
      return `${BASE_URL}/embed/series?tmdb=${id}&sea=${encodeURIComponent(season)}&epi=${encodeURIComponent(episode)}`;
    }
    return `${BASE_URL}/embed/series?tmdb=${id}`;
  }

  throw new Error('Unsupported media type');
}

function extractMovieId(html) {
  const match = html.match(/id="embed-player"\s+data-movie-id="([^"]+)"/);
  if (!match) {
    throw new Error('Movie ID not found in page');
  }
  return match[1];
}

function extractServerId(html) {
  const match = html.match(/data-id="([^"]+)"\s+class="server dropdown-item"/);
  if (!match) {
    throw new Error('Server ID not found in page');
  }
  return match[1];
}

async function getStreamLink(movieId, serverId) {
  const params = new URLSearchParams({
    id: serverId,
    movie: movieId,
    is_init: 'false',
    captcha: '',
    ref: ''
  });

  const url = `${BASE_URL}/ajax/get_stream_link?${params.toString()}`;

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

  if (!data.data || !data.data.link) {
    throw new Error('Stream link not found in response');
  }

  return data.data.link;
}

async function getMovieStream(tmdbId) {
  const embedUrl = buildEmbedUrl(tmdbId, 'movie', null, null);

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
    type: 'movie',
    provider: 'megaembed',
    behaviorHints: {
      notWebReady: true,
      filename: streamLink,
      referer: BASE_URL,
      origin: BASE_URL
    }
  }];
}

async function getSeriesStream(tmdbId, season, episode) {
  if (season === null || episode === null) {
    throw new Error('Season and episode are required for series');
  }

  const embedUrl = buildEmbedUrl(tmdbId, 'tv', season, episode);

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
    type: 'tv',
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
    if (mediaType === 'movie') {
      return await getMovieStream(tmdbId);
    }

    if (mediaType === 'tv') {
      return await getSeriesStream(tmdbId, season, episode);
    }

    throw new Error(`Unsupported media type: ${mediaType}`);
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
