import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/user.js';

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  issuer: 'ecommerce-api',
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.id).select('-password');
    
    if (user && user.isActive) {
      return done(null, user);
    }
    
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      // User exists with Google ID
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }
    
    // Check if user exists with the same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // User exists with email, link Google account
      user.googleId = profile.id;
      user.isVerified = true; // Google email is already verified
      user.lastLogin = new Date();
      
      if (!user.avatar && profile.photos && profile.photos[0]) {
        user.avatar = profile.photos[0].value;
      }
      
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      isVerified: true, // Google email is already verified
      avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      acceptedTerms: true, // Assume acceptance for social login
      acceptedPrivacy: true,
      lastLogin: new Date(),
    });
    
    await user.save();
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.SERVER_URL}/api/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'email', 'photos'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Facebook ID
    let user = await User.findOne({ facebookId: profile.id });
    
    if (user) {
      // User exists with Facebook ID
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }
    
    // Check if user exists with the same email (if email is provided)
    if (profile.emails && profile.emails[0]) {
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // User exists with email, link Facebook account
        user.facebookId = profile.id;
        user.isVerified = true; // Facebook email is already verified
        user.lastLogin = new Date();
        
        if (!user.avatar && profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        
        await user.save();
        return done(null, user);
      }
    }
    
    // Create new user
    const userData = {
      name: profile.displayName,
      facebookId: profile.id,
      isVerified: true, // Facebook is already verified
      avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      acceptedTerms: true, // Assume acceptance for social login
      acceptedPrivacy: true,
      lastLogin: new Date(),
    };
    
    // Add email if available
    if (profile.emails && profile.emails[0]) {
      userData.email = profile.emails[0].value;
    } else {
      // If no email, use Facebook ID as email (this is a fallback)
      userData.email = `facebook_${profile.id}@temp.com`;
    }
    
    user = new User(userData);
    await user.save();
    return done(null, user);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session (not used in JWT, but required by Passport)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (not used in JWT, but required by Passport)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});