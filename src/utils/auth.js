const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { sub: user.id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  signToken,
  publicUser
};
