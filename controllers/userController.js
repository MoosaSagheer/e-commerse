const User=require('../models/usermodel')
const Product=require('../models/products')

const bcrypt=require('bcrypt')
const auth=require('../middleware/auth')
const passport=require('../middleware/passport')

// nodemailer
const nodemailer = require('nodemailer');
const address = require('../models/address')

require('dotenv').config(); // Load environment variables

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});



// password hasing 
const securePassword=async(password)=>{
    try {
       const passwordHash=await bcrypt.hash(password,10)
       return passwordHash
    } catch (error) {
        console.log(error.message+"user securePassword Error");
        
    }
}


const loadRegister=async (req,res)=>{
    try {
      
        res.render('login',{message:"Now Login"})
    } catch (error) {
        console.log(error.message+"User loadRegister error");
        
    }

}


const insertUser=async(req,res,next)=>{
    
    try {
        if(req.body.name){
        const mail=req.body.email;
        const mobile=req.body.mno;

        const unique = await User.findOne({ $or: [{ email: mail }, { mobile: mobile }] });
        

        console.log(unique)
        if(unique){
            res.render('login',{message:'User already exist please login',addresses})
        }
        if(req.body.password!=req.body.cpassword){
            res.render('login',{message:'confirm password doesnt match',addresses})

        }
        else{
        const SPassword=await securePassword(req.body.password)
        // console.log(req.body.name)
        // console.log(req.body.email)
        // console.log(req.body.password)

        const user=new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            password:SPassword,
            is_admin:0
        })

        const userData=await user.save()
          
        if(userData){
            // sendVerifyMail(req.body.namec,req.body.email,userData._id)
           
            next()
            
        
        }
        
        else{
            res.render('login',{message:'Your Registration has been failed'})
        }
    }} 
    else{
        next()
    }
}
    catch (error) {
        console.log(error.message +"user insert Error");
    }
}







//  login user method  starting

const loginLoad= async  (req,res)=>{
    try {
        const product=await Product.find({is_deleted:false})
        const userData=req.session.User
        if(userData){
        res.render('home', {product:product,user:userData})
        // res.render('home')
        }
        else{
            res.render('home',{product:product,user:null})
        }

        
    } catch (error) {
        console.log(error.message);
        
    }
}

const login= async(req,res)=>{
    try{
        res.render('login')
    }
    catch(error){
        console.log(error.message);
    }
}


const verifyLogin= async (req,res)=>{

    try {
        const email=req.body.email
        const password=req.body.password
       const userData=await User.findOne({email:email})
        // console.log(userData);
        

        
       if(userData){
        
             const passwordMatch= await bcrypt.compare(password,userData.password)
     
            if(passwordMatch && userData.is_admin==0)
             {
            // assigning session to a variable
 
                req.session.user={
                    _id:userData._id,   
                    email:email,
                    isBlocked:false,
                    username:userData.name,
                    is_admin:userData.is_admin,
                    is_verified:userData.is_verified
                }
                if(userData.is_verified==false){
                    console.log("is_verified in user controller");
                    console.log(req.session);
        
                    // console.log( req.session.user.email,"is verified checking");
                    res.redirect('/verify')
                } 
                
                
                    if(userData.is_blocked){
                    res.render('login',{message: "You are blocked"})
                        
                    
                    }else{
                        res.redirect('/home')
                    }

            }
            else{
                res.render('login',{message:'Password is Incorrect'})

            }

        }
        else{
            res.render('login',{message:'please enter verified Email and Password'})
        }
    } 
    catch (error){
                    console.log(error.message+"user Verify login error");
                        
                }
}

const loadHome= async(req,res)=>{
    try {
        const product=await Product.find({is_deleted:false})

// ini ivide enthokkeyoo cheyyaan ind
        // const userData=await req.session?req.session.user.username:passport.newUser
        if(req.user){
            
            if(req.user?.is_admin==0){
            res.render('home', {product:product,user:req.user.name})
            }
            else{
                res.render('login',{message:"Entered incorrect details"})
            }
            }
            if( req.session?.user?._id){
        var userData=await User.findById({_id:req.session.user._id})
            }
            else if( req.session?.user_id ){
         userData=await User.findById({_id:req.session.user_id})

            }
        // console.log(passport.newUser);
        
        // const userData = req.user ? req.user.name : null;
        console.log(userData);
        console.log(req.session.user?.is_admin+"load home is user controller");
        if(userData.is_admin==0){
            console.log(userData);
        res.render('home', {product:product,user:userData.name})
        }
        else{
            res.render('login',{message:'Entered incorrect details'})
        }
        
    } catch (error) {
        console.log(error.message+"user load error ");
        
    }
}

// logout method

const userLogout= async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/')


    } catch (error) {
        console.log(error.message+"user logout error");
    }

}

const editLoad=async(req,res)=>{
    try {

     const id=req.query.id;
     const userData =await User.findOne({_id:id})
        

     if(userData) 
     {
        res.render('edit',{user:userData})
     }
     else{
        res.redirect('/home')
     }
    } catch (error) {
        console.log(error.message+"user editLoad error");
        
    } 
}
const updateProfile=async(req,res)=>{

    try {
        console.log("=======================================================");
        console.log(req.body,req.session);
        if( req.session?.user?._id){
            var id=req.session?.user?._id
            }
        else{
             id=req.session?.passport?.user._id
    
            }
        const userData= await User.findById(id)
        if(req.body)
            var passwordMatch= await bcrypt.compare(req.body.password,userData.password)
            if(passwordMatch){


        {
            const userData=  await  User.findByIdAndUpdate({_id:id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno}})

        }
        if(req.body?.cpassword){
            const sPassword=await securePassword(req.body.cpassword)
            const userData=  await  User.findByIdAndUpdate({_id:id},{$set:{password:sPassword}})
        }
        res.render('profile',{message:"Updated",user:userData})

    }
    else{
        res.render('profile',{message:"Password is incorrect",user:userData})
    }
        
        
    } catch (error) {
        console.log(error.message+"user updateprofile error");
    }
}


// contact and cart

const contactLoad= async  (req,res)=>{
    try {
        // console.log(req.session.user_id);
        // const userData=req.user.name
        // const userData = req.user ? req.user.name : null;
        const userData= req.session.user.username
 

        if(userData){
        res.render('contact', {user:userData})
        // res.render('home')
        }
        else{
            res.render('contact',{user:userData})
        }

        
    } catch (error) {
        console.log("contact error ");
        console.log(error.message);
        
    }
}

// product detail load
const detailLoad=async (req,res)=>{
    try {
        console.log("ividethiii");
    const productId = req.query.id;
    console.log(productId);
    // const product=await Product.findById({_id:productId})
    const product = await Product.findById(productId).populate('category');
    const relatedProducts = await Product.find({
        category: { $eq: product.category._id }, // Match the category ObjectId
        _id: { $ne: productId },is_deleted: false                   // Exclude the current product from the results
    });
    // console.log();
    const totalcount = product.sizes.reduce((sum, size) => sum + size.stock, 0);

    console.log("==============detail load details====================");
    console.log(product,totalcount);
    
      if(product){
        // console.log(product,totalcount,"if in details");
        res.render('details',{product:product,relatedProduct:relatedProducts,totalstock:totalcount})
      }
      else{
        console.log("detail load error",product,totalcount);
        res.redirect('/home')
      }
    } catch (error) {
        
    }
}

const cartLoad= async  (req,res)=>{
    // let userData=null
    try {
        // if(req.user.name){
        // userData=req.user.name
        // const userData = req.user ? req.user.name : null;
        const userData= req.session.user.username

        // console.log(req.user.name);
        // }
        // if (userData == null || userData == undefined){
        //     res.render('cart',{user:null})
        // // res.render('home')
        // }
        // else{
            res.render('cart', {user:userData})
        // }

        
    } catch (error) {
        console.log(error.message);
        
    }
}








const sendOTPVerificationEmail = async (userEmail, otp) => {
    try {
        const mailOptions = {
            from: 'moosasagheer1@gmail.com',
            to: userEmail,
            subject: 'OTP Verification',
            text: `Your OTP code is: ${otp}` 
        };

        await transporter.sendMail(mailOptions);
        // res.render('verify',{email:userData.email,message:'Verify by entering the otp sent to Email'})
        
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // Handle the error appropriately (e.g., resend, notify user)
    }
};
const verify=async (req, res,next) => {
    try {
        
    if(req.session.user.email){
    const userEmail = req.session.user.email;
    const storedOTP = auth.generateOTP();
    console.log(userEmail,storedOTP);
    req.session.user.otp=storedOTP
    req.session.user.createdAt=new Date();
    console.log(req.session.user.createdAt);
    // Store the OTP in your database (hashed for security) with the associated user

        await sendOTPVerificationEmail(userEmail, storedOTP);
        // res.render('verify',{ message: 'OTP sent successfully' });
        console.log();
        next()
    }else{
        res.redirect('/login')
    }
    } catch (error) {
        res.status(500).json({ error: 'Error sending OTP' }); 
    } 
}; 



const verified=async (req,res)=>{
    try{
       
        if(req.body.otp){
            const otp=req.body.otp
            console.log(otp,req.session.user.otp);
        if(req.session.user.otp==otp){
            console.log(new Date() , req.session.user.createdAt,"both new date and created at time");
            console.log(typeof new Date() , typeof new Date(req.session.user.createdAt),"both new date and created at time");

            req.session.user.enteredAt=new Date();
            const timeDiff = (new Date() - new Date(req.session.user.createdAt)) / 1000; // Time difference in seconds
            console.log(timeDiff,"time diffrence");
            if (timeDiff <= 30) {
                // OTP is valid
                // ... (proceed with your login logic)
                const updatedUser = await User.findByIdAndUpdate(req.session.user._id, { is_verified: 1 }, { new: true });
        
            res.redirect('/home')
            } else {
                // OTP expired
                req.session.user.otpexpired=1
                res.redirect('/verify');
            }
            
        

            }
            else{
                res.render('verify',{email:req.session.user.email,message:"Incorrect otp"})

            }
        }
        else{
            if(req.session.user.otpexpired===1){
                console.log(req.session.user.otpexpired,"");
                req.session.user.otpexpired=0
        res.render('verify',{email:req.session.user.email,message:"OTP Expired please enter new otp"})
                
                    }else{
        res.render('verify',{email:req.session.user.email,message:null})
                    }
        }
    }
    catch (error){
        console.error('Error verified in usercontroller:', error);
        
    }
}


const LoadProfile=async(req,res)=>{
    try {
        if( req.session?.user?._id){
            var id=await User.findById({_id:req.session.user._id})
            }
        else{
             id=await User.findById({_id:req.session.passport.user._id})
    
            }
        const ad=await address.find({userId:id})
        if(ad?.address)
        var addresses= [...ad.address]
    else
    addresses=false
        const user= await User.findById(id)
        res.render('profile',{user,message:"",addresses})
    } catch (error) {
        console.log(error+"loadprofile error");
        
    }
}


const LoadAddress=async(req,res)=>{
    try {
        res.render('addAddress')
    } catch (error) {
        
    }
}






module.exports={
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout ,
    editLoad,
    updateProfile,
    contactLoad,
    cartLoad,
    login,
    sendOTPVerificationEmail,
    verify,
    verified,
    detailLoad,
    LoadProfile,
    LoadAddress
}