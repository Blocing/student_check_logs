const express = require("express");
const https = require("https");
const fs = require("fs");
const loaders = require("./loaders");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config( );

const options = {
    key: fs.readFileSync(__dirname + '/../../tls/blocing.o-r.kr_2021072207FU.key.pem'),
    cert: fs.readFileSync(__dirname + '/../../tls/blocing.o-r.kr_2021072207FU.crt.pem'),
    ca: fs.readFileSync(__dirname + '/../../tls/blocing.o-r.kr_2021072207FU.ca-bundle.pem')
};

const server = () => {
  const app = express();

  app.use(express.static(path.join(__dirname, "views")));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.set("PORT", process.env.NODE_ENV || 6464);
  loaders(app);

  https.createServer(options, app).listen(app.get("PORT"), (err) => {
  	if (err) {
		console.error(err.message);
		process.exit();
	}
  });
};

server();
