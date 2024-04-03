require("dotenv").config({ debug: process.env.DEBUG });

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const routes = require("./routes/routes.js");

const app = express();

mongoose
  .connect(
    "mongodb+srv://nikunjsojitra1416:f2D3Oygkx73ffBt3@cluster0.sjyjggw.mongodb.net/finance"
  )
  .then(() => {
    console.log("DB CONNECTED");
  })
  .catch((error) => {
    console.log("ERROR IN DB CONNECTION",error);
  });

//Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

//My Routes
app.use("/", routes);
//Port
app.listen(process.env.PORT || 8000, () => {
  console.log(`App is running on ${process.env.PORT || 8000}`);
});
