const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

// DB Packages
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

// MongoDB connection confirmation and error handling
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("MongoDB connection established \n"));

// Exercise Schema
const exerciseSchema = new Schema({
  date: { type: Date },
  duration: { type: Number },
  description: { type: String },
});

// User Schema
const usersSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
  },
  log: exerciseSchema,
});

// Model
const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", usersSchema);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

/*====================================================
 // ! To Remove All Collection 
======================================================*/
// async function removeCollections() {
//   await User.find();
//   await User.remove();
//   console.log("All Collections Removed From DB");
// }

// removeCollections();
/*=====================================================*/

// hello API
app.get("/hello", (req, res) => {
  console.log("hello");
  res.send("hello there");
});

/*
? TEST 2
* You can POST to /api/users with form data username to create a
* new user. The returned response will be an object with username
* and _id properties.
*/

app.post("/api/users", (req, res) => {
  if (req.body.username === "") {
    res.json({ error: "Please enter username" });
  } else {
    let searchUser = User.findOne(
      { username: req.body.username },
      (err, searchResult) => {
        if (searchResult) {
          res.json({ error: "Username already taken" });
        } else {
          let newUser = new User({
            username: req.body.username,
          });
          newUser.save();
          res.json({
            _id: newUser._id,
            username: newUser.username,
          });
        }
      }
    );
  }
});

/*
? TEST 3
* You can make a GET request to /api/users to get an array
* of all users. Each element in the array is an object 
* containing a user's username and _id.
*/

app.get("/api/users", async (req, res) => {
  await User.find({}, (err, resultDocs) => {
    if (err) {
      console.error(err);
      res.send(err);
    } else {
      res.json(resultDocs);
    }
  });
});

/*
? TEST 4
* You can POST to /api/users/:_id/exercises with form data 
* description, duration, and optionally date. If no date is 
* supplied, the current date will be used. The response returned 
* will be the user object with the exercise fields added.
*/

app.post("/api/users/:_id/exercises", (req, res) => {
  var newExercise = {
    date: req.body.date,
    duration: parseInt(req.body.duration),
    description: req.body.description,
  };

  if (!req.body.date) {
    newExercise.date = new Date();
  }

  User.findByIdAndUpdate(
    req.params._id,
    { $push: { log: newExercise } },
    { new: true },
    (err, userUpdate) => {
      if (err) {
        console.error(err);
        res.send(err);
      } else {
        if (!userUpdate) {
          res.json({
            error: "_id does not exist",
          });
        } else {
          let newExerciseApiObj = {
            username: userUpdate.username,
            description: newExercise.description,
            duration: newExercise.duration,
            _id: userUpdate._id,
            date: new Date(newExercise.date).toDateString(),
          };
          res.json(newExerciseApiObj);
        }
      }
    }
  );
});

/*
? TEST 5.1
* You can make a GET request to /api/users/:_id/logs to retrieve a 
* full exercise log of any user. The returned response will be the user
* object with a log array of all the exercises added. Each log item has 
* the description, duration, and date properties.

? TEST 5.2
* A request to a user's log (/api/users/:_id/logs) returns an object 
* with a count property representing the number of exercises returned.

? TEST 5.3
* You can add from, to and limit parameters to a /api/users/:_id/logs 
* request to retrieve part of the log of any user. from and to are dates 
* in yyyy-mm-dd format. limit is an integer of how many logs to send back.
*/

app.get("/api/users/:_id/logs", (req, res) => {});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
