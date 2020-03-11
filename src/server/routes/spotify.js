const router = require('express-promise-router')();
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const jwt = require('jsonwebtoken');
const db = require('../db');

const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
console.log(redirect_uri);
const queryString = params => Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');

router.get('/login', async (req, res) => {
  const userID = req.query.user_id;

  const params = {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri,
    scope: 'playlist-read-private user-read-private user-read-email',
    state: userID
  };

  res.redirect(`https://accounts.spotify.com/authorize?${queryString(params)}`);
});

router.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const userID = req.query.state;

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
  params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);

  fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
    .then(response => response.json())
    .then((response) => {
      if (response.error !== undefined) {
        console.log(`Error: ${response.error} Desc: ${response.error_description}`);
      } else {
        const accessToken = response.access_token;
        const refreshToken = response.refresh_token;

        // Get user playlists
        let { items } = fetch('https://api.spotify.com/v1/me/playlists', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
          .then(playlists => playlists.json());

        const tasks = items.map((item) => {
          const playlistUrl = item.tracks.href;
          return fetch(playlistUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }).then((x) => {
            x.json();
          });
        });

        let results = Promise.all(tasks).catch((err) => {
          console.log(err);
        });

        
        console.log(results);
        res.redirect(`${process.env.FRONTEND_URI}/spotify-test`);
      }
    });
});

router.get('/getPlaylists', async (req, res) => {
  const userID = req.query.user_id;
  const { rows } = await db.query('SELECT spotify_playlists FROM users WHERE userid=$1', [userID]);
  res.json(rows[0].spotify_playlists);
});

module.exports = router;
