const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [5, 'Coupon code must be at least 5 characters long']
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixedAmount'] // Enforce valid discount types
  },
  discountValue: {
    type: Number,
    required: true,
    validate: { // Custom validation for discount value
      validator: function(value) {
        if (this.discountType === 'percentage') {
          return value >= 1 && value <= 50; // Percentage between 1 and 50
        } else {
          return value > 0; // Fixed amount must be positive
        }
      },
      message: 'Invalid discount value. Percentage must be between 0 and 1, fixed amount must be positive.'
    }
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now // Set default start date to current time
  },
  endDate: {
    type: Date,
    validate: { // Custom validation for end date
      validator: function(value) {
        return value > this.startDate; // End date must be after start date
      },
      message: 'End date must be after start date.'
    }
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: 0 // Minimum order amount cannot be negative
  },
  description: {
    type: String,
    trim: true
  },
  products: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Product', // Reference the Product model (assuming you have one)
    // validate: { // Custom validation for products array
    //   validator: function(value) {
    //     return value.length > 0; // Products array cannot be empty
    //   },
    //   message: 'Coupon must be applicable to at least one product.'
    // }
  },
  categories: {
    type: [String],
    trim: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference the User model (assuming you have one)
  }]
});



const collection = mongoose.model('Coupon', couponSchema);
module.exports = collection