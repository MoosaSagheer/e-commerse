const address = require('../models/address');
const Cart= require('../models/cart')
const Product=require('../models/products')
const Order=require('../models/order');
const User = require('../models/usermodel');
const Coupon = require('../models/couponModel')
const mongoose = require('mongoose')

const Razorpay = require('razorpay')
const crypto = require('crypto')
require('dotenv').config()

var instance = new Razorpay({
    key_id : process.env.RAZOR_KEY,
    key_secret : process.env.RAZOR_SECRET
});

const razorpay = async (req, res) => {
    try {
        console.log("razorpay controller called");
        const options = {
            amount: req.body.amount,  // amount in the smallest currency unit
            currency: "INR"
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error("Error creating order:", err);
                return res.status(500).json({ error: "Error creating order" });
            }
            console.log(order);
            res.json(order);
        });
    } catch (error) {
        console.log("Error in razorpay controller:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const verifyPayment = async (req, res) => {
    try {
        console.log("razorpay payment verification called");
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body.response;

        const generated_signature = crypto.createHmac('sha256', process.env.SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        const isVerified = generated_signature === razorpay_signature;

        if (isVerified) {
            // Payment is successful
            console.log("Payment verified successfully");
            res.json({ status: "success", orderId: razorpay_order_id });
        } else {
            console.log("Payment verification failed");
            // ith udayippa
            // res.json({ status: "success", orderId: razorpay_order_id });

            // =======
            res.status(400).json({ error: "Payment verification failed" });
        }
    } catch (error) {
        console.log("Error in verifyPayment controller:", error);
        res.status(500).json({ error: "Server error" });
    }
};


const RazorPay=async(req,res)=>{
    try {
  
        console.log("entering razorpay");
        const{address,cartId,Paymentmethod,user,amount}=req.body
        console.log("address,cart,paymentmehtod",address,cartId,Paymentmethod,user);
        console.log(req.body);
  
        // const addressData=await Address.findById(address)
        const cart=await Cart.findById(cartId).populate('products.productId')
        // const cart= await Cart.findOne({userId:id}).populate('products.productId')
  
  
        if(cart)
            {
                console.log("cart finded",cart);
            
  // =======================
  // Use for...of loop to iterate over products
  for (const item of cart.products) {
    const product = item.productId; // Get the populated product document
  
    // Error handling: Skip if product is not found
    if (!product) {
      console.error("Product not found for item:", item);
      continue;
    }
  
    const size = item.size;
    const quantity = item.quantity;
  
    // Find the size object within the product's sizes array
    const sizeToUpdate = product.sizes.find(s => s.size === size); 
  
    // Error handling: Skip if size is not found
    if (!sizeToUpdate) {
      console.error("Size not found for product:", product, "size:", size);
      continue;
    }
    product.orderCount += quantity
  
    // Update the stock quantity for the specific size
    sizeToUpdate.stock -= quantity;
    await product.save(); // Save the updated product
  }
  // =======================
                const Orderdata= await Order.create({
                    userId:user,
                    products: cart.products.map(product => ({
                        productId: product.productId._id,
                        size: product.size,
                        quantity: product.quantity,
                        price: product.price,
                        })),
                        totalAmount:amount,
                        orderStatus:'Processing',
                        'payment_method.method':'RazorPay',
                        paymentStatus:'Paid',
                        
                        shippingAddress:req.body.address
                    
                })
  
                const saving = await Orderdata.save()
                if(saving){
                    const deleteCart= await Cart.findOne({userId:user})
                    deleteCart.products=[]
                    await deleteCart.save()
                    console.log("order saved ",Orderdata);
                    res.status(200).json({success:true})
  
                }
                else
                {
                    console.log("order not saved ");
                }
            }else
            {
                console.log('cart not founded ');
            }
        
        
        
    } catch (error) {
        
        console.log("eror from checkout controller razorpay",error);
    }
  }


const Loadorder= async (req,res)=>{
    try {
        if(req.body){
            const id=req.session?.user?._id?req.session.user._id:req.session?.passport?.user?._id
            const userData=await address.find({userId:id})
            const coupons = await Coupon.find()
            console.log("body from cart ,checkout order",req.body);
            const cart= await Cart.findById({_id:req.body.id}).populate('products.productId')
            const addr= userData.map(user => user.address)
            const quantities=req.body.quantities
            if(quantities.length>0){
            quantities.forEach((quantity, index) => {
                if (quantity > 0) {
                  cart.products[index].quantity = quantity;
                }
            })
            
            cart.total = cart.products.reduce((sum, product) => {
                product.price=product.quantity * product.productId.promoprice
                console.log(product.quantity, product.productId.promoprice);
                return sum + product.quantity * product.productId.promoprice;
              }, 0);
          
              // Save the updated cart
              await cart.save();
              console.log(cart,addr,"================loadorder cart and address ========");
            }
            return res.status(200).json({success:true})
        }
    } catch (error) {
        console.error("Error processing order:", error); // Log the error for debugging
        res.status(500).json({ error: error.message }); // Send a JSON error response
 
    }

}

const order=async (req,res)=>{

            const id=req.session?.user?._id?req.session.user._id:req.session?.passport?.user?._id
            const userData=await address.find({userId:id})
            const users = await User.findById(id)
            const coupons = await Coupon.find()

            // const shippingAddress= await address.find({userId:id && address:})
            // console.log("body from cart ,checkout order",req.body);
            const cart= await Cart.findOne({userId:id}).populate('products.productId')
            const addr= userData.map(user => user.address)
            // Create a new order
            // const order = new Order({
            //     userId: cart.userId,
            //     products: cart.products.map(product => ({
            //     productId: product.productId._id,
            //     size: product.size,
            //     quantity: product.quantity,
            //     price: product
            //     })),
            //     totalAmount: cart.total,
                
            // });

            // // Save the new order
            // await order.save();

            // Delete the cart after creating the order
            await Cart.findByIdAndDelete(id);
              if(order){
                res.render('order',{list:cart,address:addr,users,coupons})
            }
}

const cod= async(req,res)=>{
    try {
        const id=req.session?.user?._id?req.session.user._id:req.session?.passport?.user?._id
        // const userData=await address.find({userId:id})
        // const users = await User.findById(id)
        // const shippingAddress= await address.find({userId:id && address:})
        // console.log("body from cart ,checkout order",req.body);
        const cart= await Cart.findOne({userId:id}).populate('products.productId')
        // const addr= userData.map(user => user.address)
        // Create a new order
        // ========================
        
    // Use for...of loop to iterate over products
    for (const item of cart.products) {
        const product = item.productId; // Get the populated product document
  
        // Error handling: Skip if product is not found
        if (!product) {
          console.error("Product not found for item:", item);
          continue;
        }
  
        const size = item.size;
        const quantity = item.quantity;
  
        // Find the size object within the product's sizes array
        const sizeToUpdate = product.sizes.find(s => s.size === size); 
  
        // Error handling: Skip if size is not found
        if (!sizeToUpdate) {
          console.error("Size not found for product:", product, "size:", size);
          continue;
        }
  
        // Update the stock quantity for the specific size
        sizeToUpdate.stock -= quantity;
        await product.save(); // Save the updated product
      }
        // ========================
        const order = new Order({
            userId: cart.userId,
            products: cart.products.map(product => ({
            productId: product.productId._id,
            size: product.size,
            quantity: product.quantity,
            price: product.price,
            })),
            shippingAddress:req.body.address,
            totalAmount: cart.total,
            
        });

        // Save the new order
        await order.save();

        // Delete the cart after creating the order
        await Cart.findByIdAndDelete(cart._id);
          if(order){
            res.status(200).json({success:true})
        }
    } catch (error) {
        console.log("error from cod order controller",error);
    }
}


const OrderDetails= async (req,res)=>{
    try {
        console.log("order detaills user");
        const id=req.session?.user?._id?req.session.user._id:req.session?.passport?.user?._id
        let ad
        const order = await Order.findById(req.query.id).populate('userId').populate('products.productId');
        console.log(order,"====order=====");
        const Address = await address.findOne({ 'address._id': order.shippingAddress });    
        Address.address.forEach(address=>{
            if(address._id.toString()===order.shippingAddress.toString()){

                 ad=address
                 console.log(ad,address,"=========address==========");
            }
        })  
        console.log(order,order.shippingAddress,Address,"==============order and address from order details =======================");  
        res.render('orderDetails',{order,Address:ad})
    } catch (error) {
        
    }
}

const cancel=async (req, res) => {
    try {
        const orderId = req.query.id;


         // Find the order and update the status to "Cancelled"
         const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: 'Cancelled' }, // Update only the orderStatus field
            { new: true } // Return the updated order document
        );

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Perform cancellation logic here
        // For example:
        // 1. Find the order by ID.
        // 2. Update the order status to "cancelled".
        // 3. (Optional) Update product inventory if necessary.

        res.json({ updated: true }); // Send a success response
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: error.message });
    }
}

const walletUpdate = async(req,res) =>{
    try {
      console.log(req.body,"==========Body=========");
      const walletBalance = req.body.walletBalance
      const userData = await User.findById(req.session.user._id)
      const wallet = userData.wallet
      const updatedBalance = wallet-walletBalance;
      console.log(wallet,updatedBalance,"============balances================");
      userData.wallet = updatedBalance;
      const saved = await userData.save()
      console.log(saved,"saved data");
      if(saved){
        res.status(200).json({success:true})
      }
    } catch (error) {
      console.error("error from checkout controller wallet Update",error);
    }
  }


  const applyCoupon = async (req,res)=>{
    //   const { selectedCoupon, orderTotal } = req.body;
    // console.log(selectedCoupon,orderTotal,"body of apply coupon");
    //   try {
    //     const coupon = await Coupon.findOne({ code: selectedCoupon });
    
    //     if (!coupon || !coupon.isActive) {
    //       console.log("!coupon || !coupon.isActive");
    //       return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
    //     }
    
    //     else if (coupon.minimumOrderAmount > orderTotal) {
    //       console.log("coupon.minimumOrderAmount > orderTotal");
    //       return res.status(400).json({ success: false, message: 'Minimum order amount not met' });
    //     }
    
    //     else if (coupon.endDate < Date.now()) {
    //       console.log("coupon.endDate < Date.now()");
    //       return res.status(400).json({ success: false, message: 'Coupon has expired' });
    //     }
    
    //     // Handle successful coupon application (update order, calculate discount, etc.)
    //     // ... your logic to apply coupon ...
    //  else{
    //   console.log("apply coupon successs ");
    //     res.status(200).json({ success: true });
    //  }
    try{
      const { couponCode } = req.body;
      const list = await Cart.findOne({userId:req.session.user._id}); // Example list object with total amount
      const coupons = await Coupon.find({})
      const coupon = coupons.find(c => c.code === couponCode);
    
      if (coupon && coupon.isActive && coupon.minimumOrderAmount <= list.total && new Date(coupon.endDate) >= new Date()) {
        let discount;
        if(coupon.discountType== "percentage"){
          discount = coupon.discountValue * (list.total/100)
        }else{
          discount = coupon.discountValue
        } // Example discount value, calculate based on your business logic
        const newTotal = list.total - discount;
        res.json({ success: true, newTotal });
      } else {
        res.json({ success: false, message: 'Invalid or expired coupon.' });
      }
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error applying coupon' });
      }
    
    }

    const returnOrder = async(req,res) => {
        try {
            const { id } = req.query;
            const orderData = await Order.findByIdAndUpdate(id, {$set:{"orderStatus":'Return'}},{new:true})
            console.log(orderData)
            if(orderData){
                res.status(200).json({success:true})
            }
        } catch (error) {
            console.log("error from checkout controller deleteOrder",error);
        }
      }


module.exports={
    Loadorder,
    order,
    cod,
    OrderDetails,
    cancel,
    razorpay,
    verifyPayment,
    RazorPay,
    walletUpdate,
    applyCoupon,
    returnOrder
}