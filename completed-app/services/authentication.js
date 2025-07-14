require("dotenv/config");
const session = require("express-session");
const passport = require("passport");
const jwt_decode = require("jwt-decode");
const OauthStrategy = require("passport-oauth2").Strategy;
//tag::a[]
  const SamlStrategy = require("@node-saml/passport-saml").Strategy;
  const fs = require('fs');
//end::a[]

function setupPassport(app) {
  app.use(
    session({
      secret: "s3cr3t",
      resave: false,
      saveUninitialized: true,
    }),
  );
  app.use(passport.session());

  passport.serializeUser((user, callback) => {
    if (!user.email)
      throw new Error("FusionAuth did not return email for user");
    callback(null, user.email);
  });

  passport.deserializeUser((user, callback) => {
    callback(null, user);
  });

  // setupOauth(passport);
  //tag::b[]
  setupSaml(passport);
  //end::b[]
}

function setupOauth(passport) {
  const oauthOptions = {
    authorizationURL: `${process.env.AUTH_URL}/authorize`,
    tokenURL: `${process.env.TOKEN_URL}/token`,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.AUTH_CALLBACK_URL,
    scope: "openid email profile offline_access",
  };
  passport.use(
    "oauth2",
    new OauthStrategy(oauthOptions, function (
      accessToken,
      refreshToken,
      params,
      profile,
      callback,
    ) {
      const token = jwt_decode(accessToken);
      const email = jwt_decode(params.id_token).email;
      const user = { ...token, email };
      callback(null, user);
    }),
  );
}

module.exports = setupPassport;

//tag::c[]
function setupSaml(passport) {
  const samlOptions = {
    path: "/saml/callback",
    callbackUrl: "http://localhost:3000/saml/callback",
    entryPoint: process.env.SAML_URL,
    issuer: "passport-saml",
    idpCert: fs.readFileSync('cert/cert.pem', 'utf8'),
    wantAuthnResponseSigned: true,
    wantAssertionsSigned: false
  };
  passport.use(
    "saml",
    new SamlStrategy(
      samlOptions,
      function (user, callback) { callback(null, user); }, //for signon
      function (user, callback) { callback(null, user); }  //for logout
    )
  );
}
//end::c[]