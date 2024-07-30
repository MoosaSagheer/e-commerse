const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    default: () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    },
    unique: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    size: {
     type:String,
     required:true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
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
  totalAmount: {
    type: Number,
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'address'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  payment_method: {
    method: {
        type: String,
        enum: ['COD', 'RazorPay'],
    
        required: true
    }
},
  orderStatus: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled','Return',],
    default: 'Processing'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  charges:{
    type: Number,
  }
});

orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  this.charges = this.totalAmount > 1000 ? 65 : 0;
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
