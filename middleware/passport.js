const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
    callbackURL: "http://localhost:3000/auth/google/callback" 
}, async (accessToken, refreshToken, profile, done) => {
    // Find or create a user based on the Google profile 
    const existingUser = await User.findOne({ email: profile.emails[0].value });

    if (existingUser) {
        console.log("existing user");
        session.user={
            _id:existingUser._id,   
            email:existingUser.email,
            isBlocked:existingUser.is_blocked,
            username:existingUser.name,
            is_admin:existingUser.is_admin,
            is_verified:existingUser.is_verified
        }
        console.log(session.user.isBlocked);
        return done(null, existingUser);
    } 

    // Create a new user
    const newUser = new User({
        _id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value ,
        password:123,
        mobile:"",
        is_verified:1,
        is_admin:0
    });
    

    await newUser.save(); 
    session.user={
        _id:newUser._id,   
        email:newUser.email,
        isBlocked:false,
        username:newUser.name,
        is_admin:newUser.is_admin,
        is_verified:newUser.is_verified
    }
    console.log(newUser);
    done(null, newUser); 
}));




module.exports = passport;
