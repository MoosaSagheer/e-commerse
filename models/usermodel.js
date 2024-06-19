const mongoose=require('mongoose')




const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{type:String,
    required:true
    },
    mobile:{
        type:String,
        default:""
    },
    password:{
        type:String,
        default:""
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    token:{
        type:String,
        default:''

    }

 
})

// automaticaly mongo db User created

const collection=mongoose.model('User',userSchema)
module.exports=collection