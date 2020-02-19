const router = require('express-promise-router')();
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const jwt = require('jsonwebtoken');
const db = require('../db');

const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

router.get('/login', async (req, res) => {

  const params = {
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: 'user-read-private user-read-email',
    redirect_uri
  };

  const queryString = Object.keys(params).map((key) => {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
  }).join('&');

  console.log(redirect_uri);
  res.redirect(`https://accounts.spotify.com/authorize?${queryString}`);
});

router.get('/callback', async (req, res) => {
  let code = req.query.code || null

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);
  params.append('grant_type', 'authorization_code');

  fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    }
  })
    .then(response => response.json())
    .then((response) => {

      if (response.error !== undefined) {
        console.log(`Error: ${response.error} Desc: ${response.erorr_description}`);
      }
      else {
        const accessToken = response.access_token;
        const refreshToken = response.refresh_token;

        fetch('https://api.spotify.com/v1/users/starlank/playlists', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        .then(playlists => playlists.text())
        .then((playlists) => {
          console.log(playlists);
        });
      }
    });
});

module.exports = router;
