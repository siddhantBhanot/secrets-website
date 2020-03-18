//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.set('trust proxy', 1) // trust first proxy

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost/userDB', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('MongoDB Connected...'))
    .catch((err) => console.log(err));

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

// Will check if a user is authenticated to access the secrets page ie, if they are logged in or not
app.get("/secrets", function(req, res) {
  if(req.isAuthenticated()) {
    res.render("secrets");
  }
  else {
    res.redirect("/login");
  }
});

//logout route will deAuthenticate users and the session
app.get("/logout", function(req, res) {
  req.logout(); //passport's logout function
  res.redirect("/");
});


//Register the user user with field active set to false
// and try to authenticate this user in a second step by redirecting to secrets page
app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err)
    {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local")(req, res, function() {
        //callback when authentication is successful
        res.redirect("/secrets"); //here we are not rendering a secrets page but redirecting
      });
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  // using passport's login() method
  req.login(user, function(err) {
    if(err)
      console.log(err);
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets"); //here we are not rendering a secrets page but redirecting
      });
    }
  })
});

// both in register and login we create a cookie, save the cookie in the user's browser
// and redirect the user to secrets page where the user makes a get request and sends the cookie
// (just made) for authentication.


app.listen(3000, function() {
  console.log("Server started at port 3000");
});
