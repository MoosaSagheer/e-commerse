const mongoose=require('mongoose')
const path=require('path')

mongoose.connect('mongodb://127.0.0.1:27017/user')
.then(()=>console.log('database created'))
.catch((err)=>console.log('db is not connected ',err))


const express=require('express')
const app= express()
const PORT=4000
// const session=require('express-session')
// const config=require('./config/config.js')
const passport = require('./middleware/passport');


 
 

// public setting
app.use(express.static('public'));
app.use(express.static(path.join(__dirname,'public')))

 
// for user route
const userRoute=require('./routes/userRoutes')
app.use('/',userRoute)

 
// for Admin route
const adminRoute=require('./routes/adminRoutes')
app.use('/admin',adminRoute)

// Configure passport session management
// app.use(session({  name:'user_session',
// secret:config.sessionSecret,
//  resave:false,
// saveUninitialized:false }));
app.use(passport.initialize());
app.use(passport.session());



app.listen(PORT,()=>{
    console.log(`Server Running on port ${PORT}`);
})

   
