const express = require('express');
const router = require('express-promise-router')();

const app = express();
const db = require('./db');

async function getUserById(req, res, next) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM users where userid=$1', [id]);
  res.send(rows[0]);
  return next();
}

app.use(express.static('dist'));
router.get('/api/users/getUserById/:id', getUserById);
app.use(router);
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
