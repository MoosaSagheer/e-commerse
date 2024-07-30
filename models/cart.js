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
    coupon:{
        code:{
          type: String,
          default : ''
        },
        discount:{
          type: Number,
          default : 0
        }
      },
      wallet:{
        type: Number,
        default : 0
      },
    total:{
        type:Number
    },
    charges:{
        type: Number,
      }
    
})
cartSchema.pre('save', function (next) {
    this.charges = this.total > 1000 ? 65 : 0;
    next();
  });

const collection= mongoose.model('Cart',cartSchema)

module.exports=collection