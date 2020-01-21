const express = require('express');
const mountRoutes = require("./routes");

const app = express();
mountRoutes(app);

app.use(express.static('dist'));
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
