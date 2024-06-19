
const isLogin=async(req,res,next)=>{
    try {
        // req.user=await User.findById({_id:req.session.admin._id})
        // console.log(req.session.admin._id +'is login admin auth');
        if(req.session.admin)
        {
            console.log("session available");
            next()
        }
        else{
           res.redirect('/admin') 
        }
       
    } catch (error) {
        console.log(error.message);
    }
}
const isLogout=async(req,res,next)=>
{
    try {
        console.log(req.session,"is logout admin auth");
       if(req.session.admin)
       {
        // console.log(req.session.user_id);
        res.redirect('/admin/home')
       }else
       {
        next()

       }
      
        

        
    } catch (error) {
        console.log(error.message);
    }
}
module.exports={
    isLogin,
    isLogout

}