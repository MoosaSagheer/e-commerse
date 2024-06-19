const express= require('express')
const user_route= express()
const session=require('express-session')

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const bodyparser=require('body-parser')
// secret key creating in confing folder a d module received
const config=require('../config/config.js')
const auth=require('../middleware/auth')

// session creating
user_route.use(session({
    name:'user_session',
    secret:config.sessionSecret,
     resave:false,
    saveUninitialized:false
}))


 

user_route.use(bodyparser.json())
user_route.use(bodyparser.urlencoded({extended:true}))

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

const user_Controller=require('../controllers/userController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController.js')


user_route.get('/register',auth.isLogout,user_Controller.loadRegister)
user_route.post('/register', user_Controller.insertUser,user_Controller.verify,user_Controller.verified)
// ... Other imports

// Route for sending OTP (e.g., after registration)
// user_route.post('/send-otp', async (req, res) => {
//     const userEmail = req.session.user.email;
//     console.log(userEmail+"send otp post");
//     const storedOTP = auth.generateOTP();

//     // Store the OTP in your database (hashed for security) with the associated user

//     try {
//         await sendOTPVerificationEmail(userEmail, storedOTP);
//         res.json({ message: 'OTP sent successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Error sending OTP' }); 
//     }
// });
// route verify
user_route.get('/verify',user_Controller.verify,user_Controller.verified)

// Route for verifying OTP
user_route.post('/verify-otp',user_Controller.verified)

user_route.get('/',auth.isLogout,auth.setNoCacheHeaders,user_Controller.loginLoad)
user_route.post('/', user_Controller.insertUser,user_Controller.verifyLogin)
user_route.get('/login',auth.isLogout, user_Controller.login) 
user_route.post('/login', user_Controller.insertUser,user_Controller.verifyLogin)
user_route.get('/home',auth.isLogin,user_Controller.loadHome)
user_route.post('/home', user_Controller.insertUser,user_Controller.verifyLogin)
user_route.get('/logout',auth.isLogin,user_Controller.userLogout)
user_route.get('/contact',auth.isLogin,user_Controller.contactLoad)
user_route.post("/product/addToCart",auth.isLogin,cartController.AddtoCart)
user_route.get("/product/cart",auth.isLogin,cartController.loadShopCart)
user_route.delete('/product/cart/remove',auth.isLogin,cartController.removeCartProduct)
user_route.post('/product/cart/quantity',auth.isLogin,cartController.ChangeQuantity)
user_route.get('/profile',auth.isLogin,user_Controller.LoadProfile)
user_route.post('/profile',auth.isLogin,user_Controller.updateProfile)
user_route.get('/profile/address/add',auth.isLogin,user_Controller.LoadAddress)
user_route.post('/product/order',auth.isLogin,orderController.Loadorder)



user_route.get('/product/detail',auth.isLogin,user_Controller.detailLoad)


// Initiate the Google login flow
user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] })); 

// Google OAuth callback
user_route.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }), // Redirect to login on failure
    (req, res) => {
        //  On successful login
        req.session.user_id= req.user.id; 
        res.redirect('/home'); 
    }
);


user_route.get('/edit',auth.isLogin,user_Controller.editLoad)
user_route.post('/edit',user_Controller.updateProfile)
// user_route.get('*',function(req,res){
//     res.redirect('/')
// })



module.exports=user_route