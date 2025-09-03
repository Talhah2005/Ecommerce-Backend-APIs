import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// make the user schema (like table structure)
const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"]
    },
    email: { 
      type: String, 
      required: [true, "Email is required"], 
      unique: true, 
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    phone: { 
      type: String, 
      unique: true, 
      sparse: true, // this allows unique with null
      trim: true,
      validate: {
        // i only check format if phone exists
        validator: function(v) {
          return !v || /^[+]?[\d\s\-\(\)]+$/.test(v);
        },
        message: "Please enter a valid phone number"
      }
    },
    password: { 
      type: String, 
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"]
    },
  },
  { 
    timestamps: true, // this makes createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual field for confirm password (not saved in db)
// use this to check password match before saving
userSchema.virtual("confirmPassword")
  .get(function () { 
    return this._confirmPassword; 
  })
  .set(function (value) { 
    this._confirmPassword = value; 
  });

// before saving user, i will hash password and check confirmPassword
userSchema.pre("save", async function (next) {
  console.log("USER: pre-save hook started");

  // only run if password changed or new
  if (!this.isModified("password")) {
    console.log("USER: password not changed, skip hashing");
    return next();
  }

  try {
    //  check confirm password only if someone set it
    if (this._confirmPassword !== undefined) {
      console.log("USER: checking confirm password match");
      if (this.password !== this._confirmPassword) {
        console.log("USER: passwords do not match, stop save");
        const error = new Error("Passwords do not match");
        error.name = 'ValidationError';
        return next(error);
      }
    } else {
      console.log("USER: confirm password was not provided (maybe update)");
    }

    //  hash the password
    const saltRounds = 12; // i use 12 rounds for better safety
    console.log("USER: hashing password with rounds:", saltRounds);
    this.password = await bcrypt.hash(this.password, saltRounds);
    console.log("USER: password hashed");

    // clear confirm virtual so it does not stay in memory
    this._confirmPassword = undefined;
    console.log("USER: cleared confirm password virtual");
    
    next();
  } catch (error) {
    console.error("USER: error in pre-save hashing:", error?.message);
    next(error);
  }
});

// method on user to compare password when login
userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("USER: comparing password now (i do not log the real passwords)");
  if (!candidatePassword) {
    console.log("USER: candidate password missing");
    return false;
  }
  try {
    const ok = await bcrypt.compare(candidatePassword, this.password);
    console.log("USER: bcrypt compare result:", ok);
    return ok;
  } catch (error) {
    console.error("USER: password comparison error:", error?.message);
    return false;
  }
};

// static helper to find by email (i make it lowercase/trim)
userSchema.statics.findByEmail = function(email) {
  console.log("USER: findByEmail called with:", email);
  return this.findOne({ email: email.toLowerCase().trim() });
};

// static helper to find by phone (trim)
userSchema.statics.findByPhone = function(phone) {
  console.log("USER: findByPhone called with:", phone);
  if (!phone || phone.trim() === '') {
    console.log("USER: phone empty so i return null");
    return null;
  }
  return this.findOne({ phone: phone.trim() });
};

const User = mongoose.model("User", userSchema);
export default User;
