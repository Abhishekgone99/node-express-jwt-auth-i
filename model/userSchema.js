const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

// our mongodb database schema
const userSchema = new Schema({
  firstName: {
    type: String,
    default: null,
    trim: true,
    required: true,
  },
  lastName: {
    type: String,
    default: null,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    trim: true,
    required: true,
  },
  token: {
    type: String,
  },
  resetToken: {
    type: String,
  },
});

// //fire a function before doc saved to db
// userSchema.pre("save", async function (next) {
//   const salt = await bcrypt.genSalt();
//   this.password = await bcrypt.hash(this.password, salt);
// });

const User = mongoose.model("User", userSchema);
module.exports = User;
