const router = require('express-promise-router')();
const db = require('../db');

router.get('/getPlaylistById/:id', async (req, res, next) => {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM playlists WHERE playlistid=$1', [id])
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });
  res.json({ result: rows[0] });
  return next();
});

module.exports = router;
