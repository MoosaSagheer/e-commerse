const mongoose=require('mongoose')


const cartSchema=new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    products:[{
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        size:{
            type:String,
            required:true
        },
        quantity:{
            type: Number,
            required:true,
            default:1
        },
        price:{
            type:Number,
            required:true
        }
    }],
    total:{
        type:Number
    }
    
})

const collection= mongoose.model('Cart',cartSchema)

module.exports=collection