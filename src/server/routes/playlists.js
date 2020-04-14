const router = require('express-promise-router')();
const db = require('../db');

router.get('/getPlaylistSongsById/:id', async (req, res, next) => {
  const { id } = req.params;
  const query = 'SELECT * FROM songs WHERE songid IN (SELECT UNNEST(songs_list) sid FROM playlists WHERE playlistid=$1)';
  const { rows } = await db.query(query, [id])
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });
  res.json({ result: rows });
  return next();
});

router.get('/getPlaylistById/:id', async (req, res, next) => {
  const { id } = req.params;
  const query = 'SELECT * FROM playlists WHERE playlistid=$1';
  const { rows } = await db.query(query, [id])
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });
  res.json({ result: rows });
  return next();
});

module.exports = router;
