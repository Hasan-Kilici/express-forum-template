const http = require("http");
const fs = require("fs");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const server = http.createServer(app);
const path = require("path");

const cookieParser = require("cookie-parser");
const axios = require("axios");

app.use(cookieParser());
const port = 8080;

//Socket
const socketio = require("socket.io");
const io = new socketio.Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
//Upload file
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/data");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
  },
});
const upload = multer({ storage: storage });
app.post("/stats", upload.single("uploaded_file"), function (req, res) {
  console.log(req.file, req.body);
});
//Body Parser
app.use(bodyParser.json()).use(
  bodyParser.urlencoded({
    extended: true,
  })
);
//Statik
app.use(express.static("public"));
app.set("src", "path/to/views");
app.use("/uploads", express.static("public/data"));
//MongoDB
const dbURL = process.env.db;
mongoose
  .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(port, () => {
      console.log("mongoDB Bağlantı kuruldu");
    });
  })
  .catch((err) => console.log(err));

//Collections
const Comments = require("./models/comments.js");
const Forum = require("./models/forums.js");
const Users = require("./models/users.js");
//viewPort
app.set("view engine", "ejs");
//DB Support
app.use(morgan("dev"));
//Pages
//HOME
app.get("/", (req, res) => {
  var userId = req.cookies.id;
  Forum.find()
    .sort({ createdAt: -1 })
    .then((ForumResult) => {
      if (userId != null) {
        Users.findById(userId)
          .then((UserResult) => {
            res.render(`${__dirname}/src/signed/index.ejs`, {
              forum: ForumResult,
              user: UserResult,
              title: `Anasayfa`,
            });
          })
          .catch((err) => {
            res.render(`${__dirname}/src/pages/index.ejs`, {
              forum: ForumResult,
              title: `Ànasayfa`,
            });
          });
      } else {
        res.render(`${__dirname}/src/pages/index.ejs`, {
          forum: ForumResult,
          title: `Anasayfa`,
        });
      }
    });
});
//Forum Page
app.get("/forum/:id", (req, res) => {
  var id = req.params.id;
  var userId = req.cookies.id;
  Forum.findById(id).then((ForumResult) => {
    Comments.find()
      .sort({ createdAt: -1 })
      .then((CommentResult) => {
        if (userId != null) {
          Users.findById(userId)
            .then((UserResult) => {
              res.render(`${__dirname}/src/signed/forum.ejs`, {
                title: `${ForumResult.title}`,
                forum: ForumResult,
                user: UserResult,
                comment: CommentResult,
              });
            })
            .catch((err) => {
              res.redirect("/");
            });
        } else {
          res.render(`${__dirname}/src/pages/forum.ejs`, {
            title: `${ForumResult.title}`,
            forum: ForumResult,
            comment: CommentResult,
          });
        }
      });
  });
});
//User Dashboard
app.get("/user/dashboard/:id", (req, res) => {
  var id = req.params.id;
  var userId = req.cookies.id;
  Forum.find({ userId: id })
    .sort({ createdAt: -1 })
    .then((ForumResult) => {
      Forum.find({ userId: id })
        .count()
        .then((ForumCount) => {
          if (id != userId) {
            res.redirect("/");
          } else {
            Users.findById(userId).then((UserResult) => {
              res.render(`${__dirname}/src/signed/dashboard.ejs`, {
                user: UserResult,
                forum: ForumResult,
                forumCount: ForumCount,
                title: `${UserResult.username} Dashboard`,
              });
            });
          }
        });
    });
});
//Register Page
app.get("/register", (req, res) => {
  var userId = req.cookies.id;
  if (userId != null) {
    Users.findById(userId)
      .then((UserResult) => {
        res.redirect("/");
      })
      .catch((err) => {
        res.redirect("/");
      });
  } else {
    res.render(`${__dirname}/src/pages/register.ejs`, { title: `Kayıt Ol` });
  }
});
//Login Page
app.get("/login", (req, res) => {
  var userId = req.cookies.id;
  if (userId != null) {
    Users.findById(userId)
      .then((UserResult) => {
        res.redirect("/");
      })
      .catch((err) => {
        res.redirect("/");
      });
  } else {
    res.render(`${__dirname}/src/pages/login.ejs`, { title: `Kayıt Ol` });
  }
});
//POSTS
//Login Form
app.post("/login", (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  Users.findOne({ username: username, password: password })
    .then((UserResult) => {
      res.cookie("id", UserResult._id);
      res.redirect("/");
    })
    .catch((err) => {
      res.send("Böyle bir kullanıcı Yok <a href='/register'>Kayıt ol</a>");
    });
});
//Register Form
app.post("/register", (req, res) => {
  var username = req.body.username;
  Users.findOne({ username: username }, (user, err) => {
    if (user) {
      res.send(
        `Bu kullanıcı adı zaten kullanımda <a href="/register">Geri Dön</a>`
      );
    } else {
      var user = new Users({
        username: username,
        password: req.body.password,
        email: req.body.email,
        profilePhoto: "uploaded_file-1658102826205-26150710.png",
      });
      user.save().then((Save) => {
        res.cookie("id", `${Save._id}`);
        res.redirect("/");
      });
    }
  });
});
//Add Forum
app.post("/new/forum/:id", (req, res) => {
  var id = req.params.id;
  Users.findById(id).then((UserResult) => {
    var forum = new Forum({
      title: req.body.title,
      description: req.body.description,
      code: req.body.code,
      solved: "false",
      comments: 0,
      user: UserResult.username,
      userId: UserResult._id,
      userPP: UserResult.profilePhoto,
    });
    forum.save().then((Result) => {
      res.redirect(`/user/dashboard/${id}`);
      console.log(Result);
    });
  });
});
//Remove Forum
app.post("/forum/remove/:id", (req, res) => {
  var id = req.params.id;
  Forum.findByIdAndDelete(id).then((Result) => {
    Comments.find({ forumId: id })
      .count()
      .then((RemoveComments) => {
        for (let i = 0; i < RemoveComments; i++) {
          Comments.findOneAndDelete({ forumId: id }).then((RemoveResults) => {
            console.log(`${i}.Yorum Silindi`);
          });
        }
        res.redirect(`/user/dashboard/${Result.userId}`);
      });
  });
});
//Add Comment
app.post("/add/comment/:id", (req, res) => {
  var id = req.params.id;
  var userId = req.cookies.id;
  Forum.findById(id).then((ForumResult) => {
    Users.findById(userId).then((UserResult) => {
      var comment = new Comments({
        title: UserResult.username,
        userPP: UserResult.profilePhoto,
        description: req.body.comment,
        like: 0,
        userId: UserResult._id,
        forumId: id,
      });
      comment.save().then((CommentResult) => {
        let yorum = Number(ForumResult.comments);
        yorum++;
        Forum.findByIdAndUpdate(id, {
          comments: yorum,
        }).then((Result) => {
          res.redirect(`/forum/${ForumResult._id}`);
        });
      });
    });
  });
});
