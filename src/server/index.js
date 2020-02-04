const express = require('express');
const bodyParser = require('body-parser');
const router = require('express-promise-router')();
const path = require('path');
const userRoutes = require('./routes/users');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('dist'));

router.use('/api/users', userRoutes);

router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.use(router);
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
