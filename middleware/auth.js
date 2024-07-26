const User=require('../models/usermodel')

const isLogin=async(req,res,next)=>{
    try {
console.log(req.session);
        
        if(await req.session?.passport?.user?._id ||  req.session?.user?._id ){
            if( req.session?.user?._id){
                var userData=await User.findById({_id:req.session.user._id})
              }
              else if( req.session?.passport?.user?._id ){
                  userData=await User.findById({_id:req.session.passport.user._id})
      
              }
            // req.user=await User.findById({_id:req.session.user_id})
            // console.log("req.user0",req.user);
            // if(await req.session?.user?.isBlocked || await req.session?.isBlocked ){
            if(userData.is_blocked){
                console.log("why coming here");
                req.session.destroy()
                res.render('login',{message:"You are blocked"})
            } 
            if(userData.is_verified==0){
                res.redirect('/verify')
            }
            // else if(await req.session.user?._id && req.session.user.isBlocked==false){
            //     console.log("ivida keri");
            //     next()
            // }
            else{
                
                console.log("req.session"+req.session,"req.session.user",req.session?.user);
                next()
                
            }
        
            
           
            
        }
        else{
            console.log("ivideyaanu pani kityath");
            res.redirect('/login')
        }
        
        
       
    } catch (error) {
        console.log("ivideyaanu sherikkum pani kityath",error);
        
    }
}
const isLogout=async(req,res,next)=>{
    try {
    
        if(req.session?.user?._id || req.session?.passport?.user?._id){
        res.redirect('/home')


        }
        next()
    } catch (error) {
        console.log(error.message);
        
    }
}
const setNoCacheHeaders = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};


const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
};

const is_verified=(req,res,next)=>{
    
}


module.exports={
    isLogin,
    isLogout,
    setNoCacheHeaders,
    generateOTP
    
} 