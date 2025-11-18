import { checkTwitchLive } from './twitchEmbed.js';
import { checkYouTubeUploads } from './youtubeEmbed.js';
import { checkKickLive } from './kickEmbed.js';

export async function checkAllPlatforms() {
  const results = [];
  results.push(...await checkTwitchLive());
  results.push(...await checkYouTubeUploads());
  results.push(...await checkKickLive());
  return results;
}
