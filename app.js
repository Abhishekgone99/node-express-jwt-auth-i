require("dotenv").config();
require("./config/database");
const express = require("express");
const User = require("./model/userSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const verifyToken = require("./middleware/auth");

// express app
const app = express();

// for parsing data which is coming from request body especially POST & PUT
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Register user
app.post("/register", async (req, res) => {
  try {
    //get user input
    const { firstName, lastName, email, password } = req.body;

    //validate user input
    if (!(firstName && lastName && email && password)) {
      res.status(400).send("All inputs are required");
    }

    //check if user already exists
    //validate if user exists in our database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User already exists. Please login");
    }

    //encrypt user password
    const encryptedPassword = await bcrypt.hash(password, 10);

    //create user in our database
    // when we use create it automatically creates a model instanse and saves it to the database, const user = await User.create({
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    const insertUser = await user.save();
    res.status(201).send(insertUser);
  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
});

//login user
app.post("/login", async (req, res) => {
  try {
    //get user input
    const { email, password } = req.body;

    //validate user input
    if (!(email && password)) {
      res.status(400).send("Email and password are required");
    }

    //check if user already exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found. please register");
    }

    //compare password with stored encryted password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send("Invalid Password");
    }

    //create token
    const token = jwt.sign({ user_id: user.id, email }, process.env.TOKEN_KEY, {
      expiresIn: "1h",
    });

    //save the token to the user record
    user.token = token;
    await user.save();

    //return the user object with the token
    res.status(200).json(user);
  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
});

//verify token and access profile
app.get("/profile", verifyToken, (req, res) => {
  try {
    // Access the authenticated user from req.user
    const authUser = req.user;
    // return the authenticated user or display it
    res.json(authUser);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

//change/update-password
app.patch("/change-password", verifyToken, async (req, res) => {
  try {
    //get user inputed password
    const { currentPassword, newPassword } = req.body;

    // get user id from authenticated user
    const user_id = req.user.user_id;
    //find the user in the database
    const user = await User.findById(user_id);

    //check if user exists
    if (!user) {
      return res.status(404).send("User not found");
    }

    // validate the current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).send("Invalid current password");
    }

    //new password
    const newEncryptedPassword = await bcrypt.hash(newPassword, 10);

    //update the users password
    user.password = newEncryptedPassword;
    await user.save();

    res.status(200).send("Password changed successfully");
  } catch (err) {
    res.status(500).send(err);
  }
});

//forgot password
app.post("/forgot-password", async (req, res) => {
  try {
    //get user input
    const { email } = req.body;

    //validate user input
    if (!email) {
      return res.status(400).send("Email is required");
    }

    //find user in database
    const user = await User.findOne({ email });

    //check if user exists
    if (!user) {
      return res.status(404).send("User not found");
    }

    // generate a reset password token
    const resetToken = jwt.sign(
      { user_id: user.id, email },
      process.env.RESET_TOKEN_KEY,
      { expiresIn: "1h" }
    );

    //using nodemailer create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "nella.beahan8@ethereal.email",
        pass: "q7b8BvMJmyjNYb8bQM",
      },
    });

    //define the email options
    const mailOptions = {
      from: "'Abhishek gone'<nella.beahan8@ethereal.email>",
      to: email,
      subject: "Reset Password Link",
      html: `<P>Click the link to rest your password</p>: <a href="http://localhost:4001/reset-password?token=${resetToken}">Reset Password</a>`,
    };

    //sens email
    await transporter.sendMail(mailOptions);

    //save the reset token to user records
    user.resetToken = resetToken;
    await user.save();

    res.status(200).send("Password reset link sent to your email");
  } catch (err) {
    res.status(400).send(err);
  }
});

//reset password
app.post("/reset-password", async (req, res) => {
  try {
    //get user input
    const { resetToken, newPassword } = req.body || req.params;

    //validate user input
    if (!(resetToken && newPassword)) {
      return res.status(400).send("Token and password are required");
    }

    // verify and decode the reset token
    const decodedToken = jwt.verify(resetToken, process.env.RESET_TOKEN_KEY);

    //validate the token
    if (!decodedToken) {
      return res.status(401).send("Invalid or expired token");
    }

    // find the user from decoded token
    const user = await User.findById(decodedToken.user_id);

    //check if user exists
    if (!user) {
      return res.status(400).send("user not found");
    }

    //update the users password with new password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    user.password = encryptedPassword;

    //clear the reset token
    user.resetToken = null;
    await user.save();

    res.status(200).send("Password changed/reset successfully");
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = app;
