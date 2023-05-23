const mongoose = require("mongoose");
const { MONGO_URI } = process.env;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected Successfully");
  })
  .catch((err) => {
    console.log("database connection failed. exiting now...");
    console.error(err);
    process.exit(1);
  });
