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
                        coupon:cart.coupon,
                        wallet:cart.wallet,
                        orderStatus:'Processing',
                        'payment_method.method':'RazorPay',
                        paymentStatus:'Paid',
                        
                        shippingAddress:req.body.address
                    
                })
  
                const saving = await Orderdata.save()
                if(req.session?.coupon){
                console.log(req.session.coupon,'coupon from session');
                // await req.session.coupon.save()
                const coupon = await Coupon.findById(req.session.coupon._id)
                coupon.usedBy =req.session.coupon.usedBy
                coupon.save()
                }
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
                product.price
                // console.log(product.quantity, product.productId.promoprice);
                return sum + product.price;
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
            coupon:cart.coupon,
            wallet:cart.wallet,
            shippingAddress:req.body.address,
            'payment_method.method':'COD',
            totalAmount: cart.total,
            
        });
        if(req.session?.coupon){

        console.log(req.session.coupon,'coupon from session');
        const coupon = await Coupon.findById(req.session.coupon._id)
        coupon.usedBy =req.session.coupon.usedBy
        coupon.save()
        }
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
        }else{
            const user = await User.findById(req.session.user._id)
            user.wallet += updatedOrder.totalAmount
            const walletUpdated = await user.save()
        if(walletUpdated){
        res.json({ updated: true }); // Send a success response
        }
        }
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
      const updatedBalance = Math.max(wallet-walletBalance,0);
      const walletUsed =Number(wallet - updatedBalance)
      console.log(walletUsed,typeof(walletUsed),'walletused');
    //   const cart = await Cart.findOne({userId:req.session.user._id},{wallet:walletUsed},{new:true})
    const cart = await Cart.findOneAndUpdate(
        { userId: req.session.user._id },
        { wallet: walletUsed },
        { new: true }
      );

      console.log(cart.wallet,'wallet amount used');
      console.log(wallet,updatedBalance,"============balances================");
      userData.wallet = updatedBalance;
      const saved = await userData.save()
      console.log(saved,"saved data");
      if(saved && cart){
       return res.status(200).json({success:true})
      }
    } catch (error) {
      console.error("error from checkout controller wallet Update",error);
    }
  }


  const applyCoupon = async (req,res)=>{
    
    try{
      const { couponCode } = req.body;
      const list = await Cart.findOne({userId:req.session.user._id}); // Example list object with total amount
      const coupons = await Coupon.find({})
      const coupon = coupons.find(c => c.code === couponCode);
      console.log(coupon,'coupon exist');
      const used = coupon.usedBy.find(c => c == req.session.user._id)
      console.log(used,'used coupon');
      if (coupon && coupon.isActive && coupon.minimumOrderAmount <= list.total && new Date(coupon.endDate) >= new Date() && !used ) {
        let discount;
        if(coupon.discountType== "percentage"){
          discount = coupon.discountValue * (list.total/100)
        }else{
          discount = coupon.discountValue
        } // Example discount value, calculate based on your business logic
        coupon.usedBy.push(req.session.user._id)
        // made changes here
        req.session.coupon=coupon
        list.coupon={code:coupon.code,discount:discount}
        await list.save()
        console.log(list.coupon);
        const newTotal = list.total - discount; 
        res.json({ success: true, newTotal });
      } else if(used) {
        res.json({ success: false, message: 'already used' });
      } else{
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

      const loadInvoice = async(req,res)=>{
        try {
          console.log("###############invoice #############");
            const userId=req.session.user._id
            const orderId=req.query.id
            
    
    
            
            
            
            console.log("orderId ",orderId);
            const orderData = await Order.findOne({_id: orderId })
           .populate('products.productId')
           
           .populate('userId')
    
           const addressId=orderData.shippingAddress.toString()
            const Address= await address.findOne({userId:req.session.user._id})
            const match = Address.address.find(address=> address._id.equals(addressId))
           
          
           if(orderData)
                {
                    console.log("userNAme",orderData.userId.name);
                    console.log("order data find",orderData);
                    const orderIdd=orderData._id
                    console.log("order",orderIdd);
                    
                         
                            console.log("find order detailas");
                            res.render('invoice',{order:orderData, address:match})
                        
                }
                else
                {
                    console.log("orderData not found");
                }
            
        } catch (error) {
            
            console.log("error from checkoutControllwer loadInvoice",error);
        }
    }

    const paymentFailure = async(req,res) => {
        try {
      
          console.log("entering razorpay");
          const{address,cartId,amount}=req.query
          console.log("address,cartId,amount",address,cartId,amount);
      
          const user = req.session.user._id
          
      
          // const addressData=await Address.findById(address)
          const cart = await Cart.findById(cartId).populate('products.productId')
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
                          cartId:cartId,
                          totalAmount:amount,
                          coupon:cart.coupon,
                          wallet:cart.wallet,
                          orderStatus:'Processing',
                          'payment_method.method':'RazorPay',
                          paymentStatus:'Failed',
                          
                      
                          shippingAddress:address                   
                  })
      
                  const saving = await Orderdata.save()
                  // if(saving){
                  //     const deleteCart= await Cart.findOne({userId:user})
                  //     deleteCart.products=[]
                  //     await deleteCart.save()
                  //     console.log("order saved ",Orderdata);
                  //     res.status(200).json({success:true})
      
                  // }
                  // else
                  // {
                  //     console.log("order not saved ");
                  // }
      
                  if(saving)
                    res.status(200).json({success:true,cartId:cartId})
                   else
                   res.status(200).json({success:false})
              }else
              {
                  console.log('cart not founded ');
              }
          
          
          
      } catch (error) {
          
          console.log("error from checkout controller payment failure",error);
      }
      }

const retryPayment = async (req,res)=>{
    try {
        const id=req.session?.user?._id?req.session.user._id:req.session?.passport?.user?._id
            const userData=await address.find({userId:id})
            const users = await User.findById(id)
            const coupons = await Coupon.find()

            // const shippingAddress= await address.find({userId:id && address:})
            // console.log("body from cart ,checkout order",req.body);
            const cart= await Order.findById(req.query.id).populate('products.productId')
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
              if(order){
                res.render('retryPayment',{list:cart,address:addr,users,coupons})
            }
    } catch (error) {
        
    }
}


const retryCod = async (req,res)=>{
    try {
        const {Paymentmethod,orderId} = req.body
        const order = await Order.findByIdAndUpdate(orderId,{'payment_method.method':'COD'})
        if(order){
            res.status(200).json({success:true})
        }
    } catch (error) {
        
    }
}

const retryRazorPay = async (req,res)=>{
    try {
        const {Paymentmethod,orderId} = req.body
        const order = await Order.findByIdAndUpdate(orderId,{'payment_method.method':'RazorPay',paymentStatus:'Paid'})
        if(order){
            res.status(200).json({success:true})
        }
    } catch (error) {
        
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
    returnOrder,
    loadInvoice,
    paymentFailure,
    retryPayment,
    retryCod,
    retryRazorPay


}