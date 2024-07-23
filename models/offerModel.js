const mongoose= require('mongoose')

const offerSchema=mongoose.Schema({

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
    },
    offerName:{
        type:String,
        required:true
    },
    offerDescription:{
        type:String,
        required:true
    },
    Discount:{
        type:Number,
        required:true
    },
    offertype:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true
    }

    

    
})


module.exports = mongoose.model('offer',offerSchema)