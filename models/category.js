const mongoose=require('mongoose')


const CatagorySchema=new mongoose.Schema({
    maincatagory:{
        type:String,
        required:true
    },
    subcatagory:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    is_Deleted:{
        type:Boolean,
        default:false
    }

 
})

// automaticaly mongo db User created

const collection=mongoose.model('Category',CatagorySchema)
module.exports=collection