const router = require('express-promise-router')();
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const join = require('lodash.join');
const qs = require('querystring');
const db = require('../db');

const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

function refreshToken(userID)
{
  db.query('SELECT spotify_refreshtoken FROM users WHERE userid=$1', [userID])
  .then(res => {
    const refreshToken = res.rows[0].spotify_refreshtoken;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
    params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
      .then(response => response.json())
      .then((response) => {
        const newAccessToken = response.access_token;

        db.query('UPDATE users SET spotify_accesstoken=$1 WHERE userid=$2', [newAccessToken, userID])
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: err });
          return next();
        });
      });
  })
}

router.get('/login', async (req, res) => {
  const userID = req.query.user_id;

  const params = {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri,
    scope: 'playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative user-read-private user-read-email',
    state: userID
  };

  res.redirect(`https://accounts.spotify.com/authorize?${qs.stringify(params)}`);
});

router.get('/callback', async (req, res, next) => {
  const code = req.query.code || null;
  const userID = req.query.state;

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
  params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);

  const tokens = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
    .then(response => response.json())
    .then((response) => {
      if (response.error !== undefined) {
        console.log(`Error: ${response.error} Desc: ${response.error_description}`);
        throw new Error(response.error);
      }
      return {
        spotifyAccessToken: response.access_token,
        spotifyRefreshToken: response.refresh_token
      };
    }).catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
      return next();
    });

  db.query('UPDATE users SET spotify_accesstoken=$1, spotify_refreshtoken=$2 WHERE userid=$3', [tokens.spotifyAccessToken, tokens.spotifyRefreshToken, userID])
  .catch((err) => {
    console.log(err);
    res.status(500).json({ error: err });
    return next();
  });

  /*
  fetch(`${process.env.FRONTEND_URI}/api/spotify/importPlaylists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: tokens.spotifyAccessToken,
      user_id: userID
    })
  }).then((resp) => {
    console.log(resp);
  }).catch((err) => {
    console.log(err);
    res.status(500).json({ error: err });
    return next();
  });
  */

  // Store Spotify ID
  fetch('https://api.spotify.com/v1/me', { headers: { 'Authorization': `Bearer ${tokens.spotifyAccessToken}` }})
  .then(userData => userData.json())
  .then((userData) => {
    db.query('UPDATE users SET spotify_id=$1 WHERE userid=$2', [userData.id, userID])
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
  });

  // Store user playlists
  fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
    headers: { 'Authorization': `Bearer ${tokens.spotifyAccessToken}` }
  })
  .then(playlists => playlists.json())
  .then((playlists) => {
    db.query('UPDATE users SET spotify_playlists=$1 WHERE userid=$2', [playlists, userID])
    .then(() => { res.redirect(`${process.env.FRONTEND_URI}/playlists`) });
  });
});

router.get('/getPlaylists', async (req, res) => {
  const userID = req.query.user_id;
  const { rows } = await db.query('SELECT spotify_playlists FROM users WHERE userid=$1', [userID]);
  res.json(rows[0].spotify_playlists);
});

router.get('/getPlaylistTracks', async (req, res) => {
  const userID = req.query.user_id;
  const playlistID = req.query.playlist_id;

  await refreshToken(userID);

  const { rows } = await db.query('SELECT spotify_accesstoken FROM users WHERE userid=$1', [userID]);
  const accessToken = rows[0].spotify_accesstoken;

  fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks?fields=items(track(name,id,artists,album))`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  .then(response => response.json())
  .then((response) => {
    res.json(response);
  });
});

// Export playlist
router.post('/exportPlaylist', async (req, res, next) => {
  const userID = req.body.user_id;
  const playlistName = req.body.name;
  const trackURIs = req.body.trackURIs;
  const { rows } = await db.query('SELECT spotify_accesstoken, spotify_id FROM users WHERE userid=$1', [userID]);
  const accessToken = rows[0].spotify_accesstoken;
  const spotifyID = rows[0].spotify_id;

  refreshToken(userID);

  fetch(`https://api.spotify.com/v1/users/${spotifyID}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: playlistName,
      public: false,
      collaborative: false,
      description: "Created by Jukeboxer"
    })
  })
  .then(playlist => playlist.json())
  .then(playlist => {
    console.log("New Playlist ID: " + playlist.id);

    fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: trackURIs
      })
    })
    .then(response => response.json())
    .then(response => {
      res.status(201).json({ result: "success"});
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    })
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({ error: err });
  })
});

router.post('/importPlaylists', async (req, res, next) => {
  const { access_token, user_id } = req.body;
  const playlistsData = await fetch('https://api.spotify.com/v1/me/playlists?limit=5', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }).then(resp => resp.json())
    .then((resp) => {
      if (resp.error !== undefined) {
        console.log(resp.error);
        throw new Error(resp.error);
      }
      return resp.items;
    }).catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
      return next();
    });

  const playlistIds = await Promise.all(playlistsData.map(p => db.query('INSERT INTO playlists (ownerid, title, description, misc_data) VALUES ($1, $2, $3, $4) RETURNING playlistid',
    [user_id, p.name, p.description, JSON.stringify({ on_spotify: true, spotify_id: p.id })])
    .then((result) => {
      const { rows } = result;
      return rows[0].playlistid;
    })))
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });

  const playlistsDataWithIds = playlistsData.map((item, i) => ({
    ...item,
    jukeboxer_id: playlistIds[i]
  }));

  const playlistsTracks = await Promise.all(playlistsDataWithIds.map(async (item) => {
    const { jukeboxer_id, tracks } = item;
    const url = `${tracks.href}?limit=5`;
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }).then(resp => resp.json())
      .then((resp) => {
        if (resp.status === 500) {
          console.log(resp.error);
          res.status(500).json(resp.error);
          return next();
        }
        resp.jukeboxer_id = jukeboxer_id;
        return resp;
      }).catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
        return next();
      });
  }));

  await Promise.all(playlistsTracks.map(async (p) => {
    await db.query('UPDATE playlists SET misc_data=misc_data::jsonb || $1::jsonb WHERE playlistid=$2',
      [JSON.stringify({ tracks: p }), p.jukeboxer_id]).then((x => console.log(x)));
  })).catch((err) => {
    console.log(err);
    res.status(500).json({ error: err });
    return next();
  });

  const songsIds = await Promise.all(playlistsTracks.map(async t => fetch(`${process.env.FRONTEND_URI}/api/songs/importSongs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      access_token,
      user_id,
      playlistId: t.jukeboxer_id
    })
  })
    .then((resp) => {
      if (resp.error) {
        console.log(resp.error);
        res.status(500).json(resp.error);
        return next();
      }
      return resp.json();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
      return next();
    })));
  console.log(songsIds);

  await Promise.all(songsIds.map((songsArrays) => {
    const { playlistId, songIds } = songsArrays;
    const pgArray = `{${join(songIds, ',')}}`;
    return db.query("UPDATE playlists SET songs_list=$1, misc_data=misc_data::jsonb-'tracks' WHERE playlistid=$2",
      [pgArray, playlistId])
      .then((x) => {
        console.log(x);
      }).catch((err) => {
        console.log(err);
        res.status(500).json(err);
        return next();
      });
  })).catch((err) => {
    console.log(err);
    res.status(500).json(err);
    return next();
  });
  res.json({ message: 'successfully imported the playlists!' });
  return next();
});

module.exports = router;
