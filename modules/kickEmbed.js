const {
  KICK_CLIENT_ID,
  KICK_CLIENT_SECRET,
  KICK_USERNAME
} = process.env;

let accessToken = null;
let lastStreamId = null;

async function getKickToken() {
  if (accessToken) return accessToken;

  const res = await fetch("https://kick.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: KICK_CLIENT_ID,
      client_secret: KICK_CLIENT_SECRET,
      grant_type: "client_credentials",
    })
  });

  const data = await res.json();
  accessToken = data.access_token;
  return accessToken;
}

export async function getKickData({ skipCache = false } = {}) {
  try {
    const token = await getKickToken();
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_USERNAME}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const stream = data.livestream;

    if (stream?.is_live) {
      if (!skipCache && stream.id === lastStreamId) return null;
      lastStreamId = stream.id;

      return {
        username: stream.user.username,
        title: stream.session_title,
        url: `https://kick.com/${KICK_USERNAME}`,
        thumbnail: stream.thumbnail?.src || null,
        category: stream.category?.name,
        viewers: stream.viewer_count
      };
    }

    const last = data.recent_livestreams?.[0];
    if (!last) return null;

    if (!skipCache && last.id === lastStreamId) return null;
    lastStreamId = last.id;

    return {
      username: KICK_USERNAME,
      title: last.session_title,
      url: `https://kick.com/${KICK_USERNAME}`,
      thumbnail: last.thumbnail?.src || null,
      category: last.category?.name,
      viewers: null,
      publishedAt: last.created_at
    };
  } catch (err) {
    console.error('[kickData:error]', err);
    return null;
  }
}
