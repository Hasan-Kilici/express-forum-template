const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let forumSchema = new Schema(
  {
    title: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true,
    },
    comments: {
      type: Number,
      require: true,
    },
    solved: {
      type: String,
      require: true,
    },
    code: {
      type: String,
      require: true,
    },
    user: {
      type: String,
      require: true,
    },
    userId: {
      type: String,
      require: true,
    },
    userPP:{
      type: String,
      require: true,     
    },
   
  },
  { timestamp: true }
);

let forum = mongoose.model("Forums", forumSchema);
module.exports = forum;
