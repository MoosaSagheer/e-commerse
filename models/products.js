const mongoose=require('mongoose')

const ProductSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{type:Number,
    required:true
    },
    promoprice:{type:Number,
    required:true
    },
    sizes: [{
        size: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL'], required: true },
        stock: { type: Number, required: true, default: 0 }
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Reference to your Category model
        required: true
      },
    is_deleted:{
        type:Boolean,
        default:false
    },
    images:[{
        type:String
    }],
    createdAt: {
        type: Date,
        default: Date.now
      },


 
})

// automaticaly mongo db User created

const collection=mongoose.model('Product',ProductSchema)
module.exports=collection