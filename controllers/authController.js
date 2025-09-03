// controllers/authController.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// this makes a token using user id
const generateToken = (id) => {
  console.log("JWT: making token for user id:", id?.toString());
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// --- SIGNUP ---
export const signup = async (req, res) => {
  console.log("SIGNUP: i got a signup request");
  try {
    // take data from body
    const { name, email, phone, password, confirmPassword } = req.body || {};
    console.log("SIGNUP: raw input (i don't log password) ->", {
      name,
      email,
      phone,
      passwordLength: password ? password.length : 0,
      confirmPasswordLength: confirmPassword ? confirmPassword.length : 0,
    });

    // basic required fields
    if (!name || !email || !password) {
      console.log("SIGNUP: missing required fields");
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // check passwords match
    if (password !== confirmPassword) {
      console.log("SIGNUP: passwords do not match");
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // check email already in db
    console.log("SIGNUP: checking if email already exists:", email);
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      console.log("SIGNUP: email exists already");
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // check phone only if user sent it
    if (phone && phone.trim() !== "") {
      console.log("SIGNUP: checking if phone already exists:", phone);
      const existingByPhone = await User.findOne({ phone: phone.trim() });
      if (existingByPhone) {
        console.log("SIGNUP: phone exists already");
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    } else {
      console.log("SIGNUP: user did not give phone or it is empty");
    }

    // prepare the data to save (i trim strings, i lowercase email)
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password, // model will hash this (comparePassword uses hashed)
      ...(phone && phone.trim() !== "" ? { phone: phone.trim() } : {}),
    };
    console.log("SIGNUP: final user data to create (no password shown):", {
      name: userData.name,
      email: userData.email,
      phone: userData.phone || null,
    });

    // now  create the user in db
    console.log("SIGNUP: creating user in database...");
    const user = await User.create(userData);
    console.log("SIGNUP: user created with id:", user._id.toString());

    // make jwt token now
    const token = generateToken(user._id);
    console.log("SIGNUP: token created, sending response");

    //  send success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
      },
    });
  } catch (err) {
    console.error("SIGNUP: error happened:", err);

    // validation error (like required field missing in schema)
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      console.log("SIGNUP: validation error details:", errors);
      return res.status(400).json({
        success: false,
        message: errors.join(". "),
      });
    }

    // duplicate key error (unique index like email/phone)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      console.log("SIGNUP: duplicate field error on:", field);
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    console.log("SIGNUP: unknown server error, sending 500");
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  console.log("LOGIN: i got a login request");
  try {
    // get email and password from body
    const { email, password } = req.body || {};
    console.log("LOGIN: raw input (not showing password):", { email });

    // check both provided
    if (!email || !password) {
      console.log("LOGIN: missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // find user by email
    const cleanEmail = email.trim().toLowerCase();
    console.log("LOGIN: searching user by email:", cleanEmail);
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      console.log("LOGIN: user not found by email");
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // compare password using model method
    console.log("LOGIN: comparing password now...");
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("LOGIN: password is not valid");
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // make token
    const token = generateToken(user._id);

    console.log("LOGIN: sending success response");
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
      },
    });
  } catch (err) {
    console.error("LOGIN: server error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// --- ME (protected) ---
export const me = async (req, res) => {
  console.log("ME: i got a request to get current user info");
  try {
    // req.user.id is from auth middleware after token check
    console.log("ME: reading user id from req.user:", req.user?.id);
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      console.log("ME: user not found in database");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("ME: user found, sending basic info now");
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("ME: server error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
