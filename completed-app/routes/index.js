const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");

const router = express.Router();

function checkAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) return res.redirect("/login");
  return next();
}

router.get("/", function (req, res, next) {
  if (req.isAuthenticated()) return res.redirect("/account");
  res.render("index", {});
});


//tag::a[]
// router.get("/login", passport.authenticate("oauth2"));   <-- REPLACE THIS LINE
router.get("/login", passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }), function (req, res) {res.redirect("/");});

router.post("/saml/callback",
  bodyParser.urlencoded({ extended: false }),
  passport.authenticate("saml", {
    failureRedirect: "/",
    failureFlash: true,
  }),
  function (req, res, next) {
    res.redirect("/account");
  }
);
//end::a[]

router.get(
  "/auth/callback",
  passport.authenticate("oauth2", {
    successRedirect: "/account",
    failureRedirect: "/",
  }),
);

router.get("/logout", function (req, res, next) {
  req.logOut(() => {
    res.redirect("/");
  });
});

router.get("/account", checkAuthenticated, function (req, res, next) {
  res.render("account", { email: req.user });
});

module.exports = router;
