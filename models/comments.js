const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let commentSchema = new Schema({
  title: {
    type: String,
    require: true,
  },
  userPP:{
    type: String,
    require: true, 
  },
  description: {
    type: String,
    require: true,
  },
  like: {
    type: Number,
    require: true,
  },
  forumId:{
    type: String,
    require: true, 
  },
  userId:{
    type: String,
    require: true,  
  }
},
{timestamp:true}                            
);

let comment = mongoose.model("Comment", commentSchema);
module.exports = comment;

