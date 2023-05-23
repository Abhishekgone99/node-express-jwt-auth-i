const jwt = require("jsonwebtoken");

// verify token middleware
const verifyToken = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];

  // check if token exists
  if (!token) {
    return res.status(401).send("Access Denied. Token is missing");
  }

  try {
    //verify token
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    //add decoded token to request object
    req.user = decoded;
    //proceed to next middleware or route
    next();
  } catch (err) {
    res.status(403).send("Invalid Token");
  }
};

module.exports = verifyToken;
