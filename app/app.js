const express = require("express");
const loaders = require("./loaders");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config( );

const server = () => {
  const app = express();

  app.use(express.static(path.join(__dirname, "views")));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // app.get('/', (req, res)=>{
  //     console.log(__dirname);
  //     res.sendFile(__dirname + '/index.html');
  // })

  // app.get('/signup', (req, res)=>{
  //     console.log(__dirname);
  //     res.sendFile(__dirname + '/signup.html');
  // })

  app.set("PORT", process.env.NODE_ENV || 6464);
  loaders(app);

  app.listen(app.get("PORT"), (err) => {
    if (err) {
      console.error(err.message);
      process.exit();
  } else console.log("=========================DAPP Starting=========================");
  });
};

server();
