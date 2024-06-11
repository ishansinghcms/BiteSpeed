const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const identityRoutes = require("./routes/identityRoutes");

const port = process.env.PORT || 3000;
const mongodbUrl = process.env.MONGODB_URL;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use("/identity", identityRoutes);

// mongodb://localhost:27017/BiteSpeed
mongoose
  .connect(mongodbUrl)
  .then(() => {
    console.log("Listening to BiteSpeed API requests.");
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
