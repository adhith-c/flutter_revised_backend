require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const ejsMate = require("ejs-mate");
const app = express();
const path = require("path");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const morgan = require("morgan");
const Admin = require("./models/admin");
// const User = require("./models/user");

const dbConfig = require("./config/dbConfig");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/user/")));
app.use(logger("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
const sessionConfig = {
  secret: "ecom",
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: "mongodb://0.0.0.0:27017/ecommerce",
  }),
  cookie: {
    path: "/",
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    secure: false,
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.engine("ejs", ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes");
const propertyRouter = require("./routes/propertyRoutes");
// const cartRoutes = require("./routes/cartRoutes");
// const checkoutRoutes = require("./routes/checkoutRoutes");
// const wishlistRoutes = require("./routes/wishlistRoutes");
// const categoryRoutes = require('./routes/categoryRoutes');
// const productRoutes = require("./routes/productRoutes");
// const brandRoutes = require('./routes/brandRoutes');

// passport.use(new LocalStrategy(User.authenticate()));
//passport.use(new LocalStrategy(Admin.authenticate()));

app.use((req, res, next) => {
  res.locals.login = req.isAuthenticated();
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.adminAvailable = req.session.isAdmin;
  res.locals.currentUser = req.user;
  res.locals.session = req.session;
  next();
});

app.use(function (req, res, next) {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use("/", propertyRouter);

app.engine("ejs", ejsMate);

app.set("view engine", "ejs");

dbConfig();
app.listen(process.env.PORT, () => {
  console.log(`Listening to the server on ${process.env.PORT} !!!`);
});
