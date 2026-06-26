const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: BigInt(payload.sub) }
    });

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Invalid or inactive user" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authMiddleware;
