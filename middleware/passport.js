const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');

const User = require('../models/usermodel'); // Your Mongoose User model
require('dotenv').config(); 


const express= require('express')
const pass_route= express()
const session=require('express-session')


const user_route=require('../routes/userRoutes')
const config=require('../config/config.js')

pass_route.use(session({
    name:'user_session',
    secret:config.sessionSecret,
     resave:false,
    saveUninitialized:false
}))


passport.serializeUser((user, done) => {
    done(null, user.id);  // Correctly serialize using a unique identifier
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); 
    } catch (error) {
        done(error);  
    }
});


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://thehighnessworld.com/auth/google/callback" 
}, async (accessToken, refreshToken, profile, done) => {
    // Find or create a user based on the Google profile 
    const existingUser = await User.findOne({ email: profile.emails[0].value });

    if (existingUser) {
        console.log("existing user");
           
        return done(null, existingUser);
        
    } 
    const generateReferralCode = (uname) => {
        const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `${uname.substring(0, 3).toUpperCase()}${randomString}`;
    };

    const referalCode=generateReferralCode(profile.emails[0].value)
    
    // Create a new user 
    const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value ,
        password:123,
        mobile:"",
        is_verified:1,
        is_admin:0,
        referalCode:referalCode

    });
    
    
    await newUser.save(); 
    
    console.log(newUser);
    done(null, newUser); 
}));




module.exports = passport;
