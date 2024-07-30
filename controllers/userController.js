const User=require('../models/usermodel')
const Product=require('../models/products')
const Address=require('../models/address')
const Category= require('../models/category')
const crypto = require('crypto');
const Offer = require('../models/offerModel')

const bcrypt=require('bcrypt')
const auth=require('../middleware/auth')
const passport=require('../middleware/passport')

// nodemailer
const nodemailer = require('nodemailer');
const order= require('../models/order')

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
        console.log(req.body,"bodiyil ullathh insertUser");
        if(req.body.name){
        const mail=req.body.email;
        const mobile=req.body.mno;

        const unique = await User.findOne({ $or: [{ email: mail }, { mobile: mobile }] });
        

        console.log(unique)
        if(unique){
            return res.status(200).json({success:false})
            // res.render('login',{message:'User already exist please login',addresses})
        }else{
            
        if(req.body.password!=req.body.cpassword){
            res.render('login',{message:'confirm password doesnt match',addresses:""})

        }
        else{
        const SPassword=await securePassword(req.body.password)
        // console.log(req.body.name)
        // console.log(req.body.email)
        // console.log(req.body.password)
        var uname = req.body.name
        const generateReferralCode = (uname) => {
            const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
            return `${uname.substring(0, 3).toUpperCase()}${randomString}`;
        };

        console.log(generateReferralCode('Aziyaa'));
        console.log(generateReferralCode('Aziyaa')); // Example output: 'JOH9F86D0'
         // Example output: 'JOH9F86D0'
        const referalCode=generateReferralCode(uname)

        const user=new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            password:SPassword,
            is_admin:0,
            referalCode:referalCode
        })
        
        const userData=await user.save()
        console.log(userData,"userdata from insert user");
        req.session.user={
            name:req.body.name,
            email:req.body.email,
            _id:userData._id
        }
        if(userData){
            // sendVerifyMail(req.body.namec,req.body.email,userData._id)
           
            return res.status(200).json({success:true})
            
        
        }
        
        else{
            return res.status(200).json({success:false,message: "Registration failed"})
        }
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


        var search = "";
        if(req.query.search){
          search = req.query.search;
        }
        var filter = "";
        if(req.query.filter){
            filter = req.query.filter
        }
        const categories = await Category.find({is_Deleted:false})
        
        let page = parseInt(req.query.page) || 1;
        let limit = 8;
    
        let startIndex = (page-1) * limit;

        // ================================
        let sortCriteria = {};
        const sortOption = req.query.sort;

    switch (sortOption) {
      
      case "price-asc":
        sortCriteria = { promoprice: 1 };
        break;
      case "price-desc":
        sortCriteria = { promoprice: -1 };
        break;
      
      case "new-arrivals":
        sortCriteria = { createdAt: -1 }; // Assuming createdAt is the field for new arrivals
        break;
      case "az":
        sortCriteria = { name: 1 };
        break;
      case "za":
        sortCriteria = { name: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 }; // Default sorting by newest
    }


    // ======additional features
        // case "average-ratings":
        // sortCriteria = { averageRating: -1 }; // Assuming there's an averageRating field
        // break;
        // case "featured":
        // sortCriteria = { featured: -1 }; // Assuming there's a featured field
        // break;
        // case "popularity":
        // sortCriteria = { popularity: -1 }; // Assuming there's a popularity field
        // break;
    // ========================

    let products = await Product.find({
        $and: [
          { name: { $regex: search, $options: "i" } },
          { category: filter ? filter.toString() : { $exists: true }},
          { is_deleted: false }
        ]
      })
      .sort(sortCriteria)
      .skip(startIndex)
      .limit(limit);

        // ================================
            // Apply offers
    for (let product of products) {
        let categoryOffer = await Offer.findOne({ category: product.category, isActive: true });
        let productOffer = await Offer.findOne({ product: product._id, isActive: true });

        let productDiscountedPrice = product.promoprice;
        let categoryDiscountedPrice = product.promoprice;

        if (productOffer) {
            productDiscountedPrice = product.promoprice - (product.promoprice * productOffer.Discount / 100);
        }

        if (categoryOffer) {
            categoryDiscountedPrice = product.promoprice - (product.promoprice * categoryOffer.Discount / 100);
        }

        // Check if any offer is applied
        if (productOffer || categoryOffer) {
            product.discountedPrice = Math.min(productDiscountedPrice, categoryDiscountedPrice);
        } else {
            product.discountedPrice = product.promoprice; // No offer, show promo price
        }
    }
    // ==========================
    
    
        // let product= await Product.find({$or: [{name: {$regex: search, $options: "i"}}]},{is_deleted:false}).skip(startIndex).limit(limit);
        let totalDocuments = await Product.countDocuments();
        console.log(products,"sdfgbhjm");
        let totalPages = Math.ceil(totalDocuments/limit)
        

        // const product=await Product.find({is_deleted:false})
        const userData=req.session.User
        if(userData){
        // res.render('home', {product:product,user:userData})
        res.redirect("/home")
        // res.render('home')
        }
        else{
            res.render('home',{product:products,user:null,totalPages,page,sortOption,filter,search,categories})

        }

        
    } catch (error) {
        res.status(500).json({success:false,message:"Something went wrong"})
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

        var search = "";
        var filter = "";
        if(req.query.filter){
            filter = req.query.filter
        }
        if(req.query.search){
          search = req.query.search;
        }
        const categories = await Category.find({is_Deleted:false})
    
        let page = parseInt(req.query.page) || 1;
        let limit = 8;
    
        let startIndex = (page-1) * limit;

        // ================================
        let sortCriteria = {};
        const sortOption = req.query.sort;
    switch (sortOption) {
      
      case "price-asc":
        sortCriteria = { promoprice: 1 };
        break;
      case "price-desc":
        sortCriteria = { promoprice: -1 };
        break;
      
      case "new-arrivals":
        sortCriteria = { createdAt: -1 }; // Assuming createdAt is the field for new arrivals
        break;
      case "az":
        sortCriteria = { name: 1 };
        break;
      case "za":
        sortCriteria = { name: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 }; // Default sorting by newest
    }
    // ======additional features
        // case "average-ratings":
        // sortCriteria = { averageRating: -1 }; // Assuming there's an averageRating field
        // break;
        // case "featured":
        // sortCriteria = { featured: -1 }; // Assuming there's a featured field
        // break;
        // case "popularity":
        // sortCriteria = { popularity: -1 }; // Assuming there's a popularity field
        // break;
    // ========================

    let products = await Product.find({
        $and: [
          { name: { $regex: search, $options: "i" } },
          { category: filter ? filter.toString() : { $exists: true }},
          { is_deleted: false }
        ]
      })
      .sort(sortCriteria)
      .skip(startIndex)
      .limit(limit);

        // ================================
    
    
        // let product= await Product.find({$or: [{name: {$regex: search, $options: "i"}}]},{is_deleted:false}).skip(startIndex).limit(limit);
        let totalDocuments = await Product.countDocuments({ is_deleted: false });
        console.log(products,"sdfgbhjm");
        let totalPages = Math.ceil(totalDocuments/limit)
        // const product=await Product.find({is_deleted:false})
      console.log(totalPages,"total pagess===========");
// ini ivide enthokkeyoo cheyyaan ind
        // const userData=await req.session?req.session.user.username:passport.newUser
        
        // Apply offers
        for (let product of products) {

        // Find active offers
        const categoryOffer = await Offer.findOne({ category: product.category._id, isActive: true });
        const productOffer = await Offer.findOne({ product: product._id, isActive: true });

                
        // Calculate discounted prices
        let discountedPrice = product.promoprice;

        if (productOffer) {
        discountedPrice = product.promoprice - (product.promoprice * productOffer.Discount / 100);
        }

        if (categoryOffer) {
        const categoryDiscountedPrice = product.promoprice - (product.promoprice * categoryOffer.Discount / 100);
        discountedPrice = Math.min(discountedPrice, categoryDiscountedPrice);
        }

        product.discountedPrice = discountedPrice;
        }
        // ====================================
        if(req.user){
            
            if(req.user?.is_admin==0){
            res.render('home', {product:products,user:req.user.name,page,totalPages})
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
        res.render('home', {product:products,user:userData.name,page,totalPages,sortOption,filter,search,categories})
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
        const orders= await order.find({userId:id})
        const ad=await Address.findOne({userId:id})
        if(ad?.address){
            console.log(ad.address);
        var addresses= [...ad.address]
        }
    else{
    addresses=false
    }
        
        const userData= await User.findById(id)
        if(req.body)
            var passwordMatch= await bcrypt.compare(req.body.password,userData.password)
            if(passwordMatch){


        {
            const userData=  await  User.findByIdAndUpdate({_id:id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno}})

        }
        if(req.body?.cpassword){
            const Match= await bcrypt.compare(req.body.password,userData.password)

            if(!Match){
            const sPassword=await securePassword(req.body.cpassword)
            const userData=  await  User.findByIdAndUpdate({_id:id},{$set:{password:sPassword}})
            if(userData)
                res.render('profile',{message:"Updated",user:userData,orders,addresses})

            }else{
        res.render('profile',{message:"New password and current password can't be same!!",user:userData,orders,addresses})

            }
        }

    }
    else{
        res.render('profile',{message:"Password is incorrect",user:userData,orders,addresses})
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
        // Find active offers
        const categoryOffer = await Offer.findOne({ category: product.category._id, isActive: true });
        const productOffer = await Offer.findOne({ product: product._id, isActive: true });
    
        // Calculate discounted prices
        let discountedPrice = product.promoprice;
    
        if (productOffer) {
          discountedPrice = product.promoprice - (product.promoprice * productOffer.Discount / 100);
        }
    
        if (categoryOffer) {
          const categoryDiscountedPrice = product.promoprice - (product.promoprice * categoryOffer.Discount / 100);
          discountedPrice = Math.min(discountedPrice, categoryDiscountedPrice);
        }
    
        product.discountedPrice = discountedPrice;
    
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
        console.log("verify if condition");
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
        // return res.status(200).json({success:true})

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
            if (timeDiff <= 60) {
                // OTP is valid
                // ... (proceed with your login logic)
                const updatedUser = await User.findByIdAndUpdate(req.session.user._id, { is_verified: 1 }, { new: true });
                if(updatedUser){
                    res.redirect('/home')
                }
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
        const orders= await order.find({userId:id}).sort({createdAt: -1})
        const ad=await Address.findOne({userId:id})
        if(ad?.address){
            console.log(ad.address);
        var addresses= [...ad.address]
        }
    else{
    addresses=false
    }
        const user= await User.findById(id)
        res.render('profile',{user,message:"",addresses,orders})
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


const AddAddress = async(req,res) =>{
    try {
        console.log(req.body,"=========addAddress===================");
       const id= req.session?.user?._id?req.session.user._id:req.session?.passport?.user?._id
       const address= await Address.findOne({userId:id})
       if(!address){
       const address=new Address( {userId:id,
        address:{name:req.body.name,
            country:req.body.country,
            state:req.body.state,
            street:req.body.street,
            city:req.body.city,
            pincode:req.body.pincode,
            mobile:req.body.mno}})
            const saved=await address.save()
            if(saved){
                res.redirect('/profile')
            }
        }else{
         address.address.push({name:req.body.name,
                country:req.body.country,
                state:req.body.state,
                street:req.body.street,
                city:req.body.city,
                pincode:req.body.pincode,
                mobile:req.body.mno})
                await address.save()
                res.redirect('/profile')
        }
    } catch (error) {
        console.log("error form user controller addaddress",error);
    }
}


const deleteAddress = async(req,res) =>{
    try {
        const user = req.session.user._id
        const id = req.query.id || req.body.id
        const useraddress = await Address.findOne({userId:user})

        if(useraddress){
            const addressToDelete = useraddress.address.find(address => address._id.equals(id));
            if(addressToDelete){
                const updatedAddress = useraddress.address.filter(address => !address._id.equals(id))
                useraddress.address = updatedAddress;

                await useraddress.save();

            } else {
                console.error(`Address with ID ${id} not found.`);
            }
        }

        res.status(200).json({success:true})
    } catch (error) {
        console.log("error from userscontroller delete address ");
    }


}

const loadEditAddress = async(req,res) => {
    try {
        const id = req.query.id
        const user = req.session.user._id

        const userAddress = await Address.findOne({userId:user})
        const findAddress = userAddress.address.find(address => address._id.equals(id));

        res.render('editAddress',{userAddress:findAddress})

    } catch (error) {

        console.log("error from userscontroller loadedit address");
    }
}

const editAddress = async(req,res) => {
    try {
        const addressId = req.query.id
        const user = req.session.user._id
        const {name,mno,country,state,city,street,pincode} = req.body

        const userAddress = await Address.findOne({userId:user})
        const findAddress = userAddress.address.find(address => address._id.equals(addressId))
        console.log(findAddress,"=========");
        if(findAddress){
            findAddress.name = name
            findAddress.mobile = mno
            findAddress.country = country
            findAddress.state = state
            findAddress.city = city
            findAddress.street = street
            findAddress.pincode = pincode

            const saved = await userAddress.save()
            console.log(saved,'======saved=====');
            if(saved){
                res.redirect('/profile#address')
            } else {
                res.render('editAddress',{msg:'Address not edited'})
            }

        }

    } catch (error) {
        console.log("error from userscontroller edit address",error);
    }
}

const referral = async(req,res) => {
    try {
        const user= await User.findById(req.session.user._id)
        if(user.referedBy ==''||user.referedBy == null || user.referedBy == undefined){
        const referalCode = req.body.referalCode
        console.log(req.body,referalCode);
        const referedBy = await User.findOne({referalCode:referalCode})
        console.log(referedBy,"refered user");
        console.log(referedBy._id.toString(),req.session.user._id.toString(),"refrred id's");
        
        if(referedBy._id.toString()==req.session.user._id.toString()){
            // add to referredby field check is refferedby field is not empty then only come to this area
            console.log("if conditionil keri referalil ulle");
            res.status(400).json({success:false,message:'You cant refer yourself'})
        }else{
            user.referedBy=referedBy.name
            await user.save()
            referedBy.wallet +=100;
            const save = await referedBy.save()
            if(save){
                res.status(200).json({success:true})
            }
        }
    }else{
        res.status(400).json({message:"You are already reffered"})
    }
    } catch (error) {
        console.log("error from user controller referral",error);
    }


}

const refer = async(req,res) => {
    try {
        const email = req.body.email
        const user = await User.findById(req.session.user._id)
        const referralCode = user.referalCode
        const mailOptions = {
            from: 'your_email@example.com', // Replace with your email address
            to: email,
            subject: 'Your Referral Code',
            text: `Hi there,
      
      Your referral code is: ${referralCode}
      
      Use this code to refer your friends and earn rewards!
      
      Thanks,
      The Tato Team`,
            html: `<!DOCTYPE html>
      <html>
      <body>
        <p>Hi there,</p>
        <p>Use this referral code and earn rewards!: <b>${referralCode}</b></p>
        <p>And you can earn more by referring your friends too.. </p>
        <p>Thanks,</p>
        <p>The Tato Team</p>
      </body>
      </html>
      `,
          };
          console.log(mailOptions);
          await transporter.sendMail(mailOptions);
          
        
    } catch (error) {
        console.log("error from user controller refer",error);
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
    LoadAddress,
    AddAddress,
    deleteAddress,
    editAddress,
    loadEditAddress,
    refer,
    referral
}