const router = require('express-promise-router')();
const { MusicBrainzApi } = require('musicbrainz-api');

const mbApi = new MusicBrainzApi({
  botAccount: {
    username: 'armv32020@gmail.com',
    password: process.env.BRAINZ_PASSWORD
  },
  baseUrl: 'https://musicbrainz.org',
  appName: 'jukeboxer',
  appVersion: '0.1.0',
  appMail: 'armv32020@gmail.com'
});

async function findSong(req, res, next) {
  const { artist, album, song } = req.body;
  const songSearchResults = await mbApi.search('recording', {
    artist: artist !== undefined ? artist : '',
    release: album !== undefined ? album : '',
    recording: song
  });
  let result;
  try {
    result = songSearchResults.recordings[0].releases[0];
  } catch {
      result = 'song is not in musicbrainz database';
  }
  res.send({"result": result});
  return next();
}

/* TODO later
async function submitSong(req, res, next) {
}
*/

router.post('/findSong', findSong);

module.exports = router;
