import jwt from "jsonwebtoken";
import User from "../models/User.js";

// this middleware checks token and finds user
const authMiddleware = async (req, res, next) => {
  console.log("AUTH: i got a request, i will check token now");

  try {
    //  trying to get the header first
    const authHeader = req.headers.authorization;
    console.log("AUTH: authorization header is:", authHeader ? "present" : "missing");

    // if no header, stop here
    if (!authHeader) {
      console.log("AUTH: no auth header, sending 401");
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided" 
      });
    }

    // header should start with Bearer
    if (!authHeader.startsWith("Bearer ")) {
      console.log("AUTH: header does not start with Bearer, sending 401");
      return res.status(401).json({ 
        success: false,
        message: "Access denied. Invalid token format" 
      });
    }

    // i take token after Bearer
    const token = authHeader.split(" ")[1];
    console.log("AUTH: extracted token exists:", !!token);

    if (!token) {
      console.log("AUTH: token missing after Bearer, sending 401");
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided" 
      });
    }

    try {
      // trying to verify token with secret
      console.log("AUTH: verifying token now...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("AUTH: token is valid, decoded id is:", decoded?.id);

      // finding the user in db with id
      console.log("AUTH: finding user in database by id...");
      const user = await User.findById(decoded.id).select("-password");
      console.log("AUTH: user found:", !!user);

      if (!user) {
        console.log("AUTH: user not found for this token, sending 401");
        return res.status(401).json({ 
          success: false,
          message: "Access denied. User not found" 
        });
      }

      // attaching user to request so next handler can use it
      req.user = user;
      console.log("AUTH: user attached to req, going next()");
      next();
      
    } catch (jwtError) {
      console.error("AUTH: jwt verify error:", jwtError?.name, jwtError?.message);

      // token expired
      if (jwtError.name === 'TokenExpiredError') {
        console.log("AUTH: token expired");
        return res.status(401).json({ 
          success: false,
          message: "Access denied. Token has expired" 
        });
      }
      
      // token invalid
      if (jwtError.name === 'JsonWebTokenError') {
        console.log("AUTH: token invalid");
        return res.status(401).json({ 
          success: false,
          message: "Access denied. Invalid token" 
        });
      }

      // other token errors
      console.log("AUTH: token verify failed (other reason)");
      return res.status(401).json({ 
        success: false,
        message: "Access denied. Token verification failed" 
      });
    }
    
  } catch (error) {
    console.error("AUTH: middleware crashed:", error?.message);
    return res.status(500).json({ 
      success: false,
      message: "Server error during authentication",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default authMiddleware;
