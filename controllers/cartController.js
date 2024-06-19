const Cart= require('../models/cart')
const Product=require('../models/products')
const User=require('../models/usermodel')






const loadShopCart= async(req,res)=>{
    try {
        console.log(req.body,"bodiyil cartinte");
        const userId= req.session.user._id
        
        const qty=req.body.qty
    

        
        const userData=await Cart.findOne({userId:userId})
        .populate({path:'products.productId',populate:[{path:'category'}]})


       


       


if (userData) {

let subtotal
    
    // console.log("subtotal",subtotal);
    
    let totalprice=0;
  
     userData.products.forEach(pro => {
        subtotal=pro.quantity*pro.productId.promoprice
        
        console.log(`subtotal ${pro.productId.name} = ${subtotal}`);       
     
        totalprice+=subtotal
       console.log("price is ",totalprice);
      
    });
 
    
    
    console.log("quantity is ",qty);
    console.log("price is ",totalprice);
    // console.log("quantity is ",quantity);
     
        
        
   
   
    
    
      
  
   
   

  
    
console.log("dataType" );

console.log("product tottal ");


    

    

    
            // console.log(`cart products by user ${userData.products}`);

            res.render('cart',{cart:userData,totalprice})



        }else
        {
            console.log("No cart data available for this user");
            res.render('cart',{cart:userData})
        }
     
        
        
    } catch (error) {
        
        console.log("error from cart controller loadShopCart",error);
    }
}


const AddtoCart = async (req, res) => {
    try {
        console.log("cart post");
        const userId = req.session.user._id;
        const productId = req.query.id;
        console.log("product Id from add to cart ",productId );
        const quantity = parseFloat( req.body.qty);
        const size = req.body.size;
        const price= parseFloat(req.body.price)
        console.log("price ",price);
        console.log("price ",typeof price);

        console.log("size :", size);
        console.log("qty:", quantity);

        const product = await Product.findById({_id:productId});

        console.log("product from add to cart");
       
        let cart= await Cart.findOne({userId:userId})
        const totalPrice =parseFloat( price * quantity);
        console.log("total price ", typeof totalPrice);
        console.log("total price ", totalPrice);
        console.log("cart product find :", product);
// console.log("cart.products.quantity",cart.products.quantity);

        // const existingProduct = cart.products.findIndex(pro => pro.productId.equals(productid));

        
            let totalStock = product.sizes.reduce((sum, size) => sum + size.stock, 0);
            console.log("total stock is ", totalStock);
            if (totalStock < quantity ) {
                return res.redirect('/home');
            }
        

            else{

           
        // let cart = await Cart.findOne({ userId: userId });

        
        if (!cart) {
            // If cart is null or undefined, create a new cart object
            cart = new Cart({
                userId,
               
                products: [{ productId, quantity, price: totalPrice, size: size }],
                total:totalPrice
            });
            
        } else {
            // If cart exists, proceed with checking for existing products
            const existingProductIndex = cart.products.findIndex(pro => pro.productId.equals(productId));
        
            if (existingProductIndex !== -1) {
                // Product exists in the cart, update its quantity
                cart.products[existingProductIndex].quantity += parseInt(quantity);
                cart.products[existingProductIndex].price += parseInt(price* quantity);

            } else { 
                // Product does not exist in the cart, add it

                cart.total=totalPrice 
                cart.products.push({ productId, quantity, price: totalPrice, size: size });
            }
        }

        await cart.save();
        // res.status(200).json({ message: 'Product added to cart successfully' });
  
        // const existingProduct = cart.products.findIndex(pro => pro.productId.equals(productid));




        // console.log("Existing Product:", existingProduct);
        
        // if (existingProduct) {
        //     console.log("Existing Product found. Existing Quantity:", existingProduct.quantity);
        //     existingProduct.quantity += parseInt(quantity);
        //     console.log("Updated Quantity:", existingProduct.quantity);
        // } else {
        //     console.log("Product not found in cart. Adding new product.");
        //     cart.products.push({
        //         productid,
        //         size,
        //         quantity: parseInt(quantity)
        //     });
        // }
        

        // const saving = await cart.save();
        // if (saving) {
        //     console.log("saved cart");
        // } else {
        //     console.log("failed to save cart");
        // }

        res.redirect('/product/cart');
    }
    } catch (error) {
        console.log("error from cart Controller AddtoCart", error);
       
    }
};



const removeCartProduct = async(req,res)=>{
    try {
        let userId= req.session.user._id
        const id= req.query.id
        
        let user= await Cart.findOne({userId:userId})
        if(user)
        {
            console.log("product id ",id);
            let deletecart= user.products.findIndex(products=>products._id==id)
            console.log("deltecart",deletecart);
            if(deletecart !== -1){
                
               user.products.splice(deletecart,1)
               await user.save()
               console.log("cart deleted"); 
               res.status(200).json({success:true})

                // res.redirect('/product/cart')

            }else
            {
                console.log("error not delete");
            }
            

        }

        
    } catch (error) {
        
        console.log("error from cart Controller removeCartProduct",error);
    }
}


const clearCart= async(req,res)=>{
    try {
        const id= req.query.id
      
        const clearcart= await Cart.findByIdAndDelete({_id:id})
        if(clearcart){
            console.log("deleted");
            res.redirect('/home')
        }else
        {
            console.log("not delete");
        }

        
    } catch (error) {
        
        console.log("error from cart controller clearCart",error);
    }
}




const ChangeQuantity=async(req,res)=>{
    try {
        console.log("entering change Quatity");
        const productId=req.body.productId
        const userId=req.session.user._id
        const qty= req.body.quantity
        const userData=await Cart.findOne({userId:userId})
        .populate({path:'products.productId',populate:[{path:'category'}]})
    

        console.log("product id fromm",productId);
        console.log("qty id fromm",qty);
        let totalstock;
    

        if(userData)
        {
            const product = userData.products.find((pro) => pro.productId._id.toString() === productId);
            console.log("product iddd ",product);

            if(!product)
            {
                console.log("no product ");
                // res.redirect('/product/cart')
                return res.status(404).json({ success: false, error: "Product not found in cart" });

            }else   
            {
                console.log("Product Size:", product.size);
                console.log("Product Stock:", product.productId.sizes.size);
                const availableStock = product.productId.sizes.size[product.size.toUpperCase()];
                console.log("Available Stock:", availableStock);

                if (qty > availableStock) {
                    res.status(400).json({success:false,error: `${product.productId.name} (${product.size}) has only ${availableStock} product(s) available.`});

                    product.quantity=1
                    const totalPrice = product.productId.promoprice * qty;
                    product.total_price=totalPrice
                    await userData.save()
                }
                else
                {

                // for (const item of userData) {
                //     const productId = item.productId;
                //     const size = item.size;
                //     const quantity = item.quantity;
                
                //     // Find the product by ID
                //     const product = await Product.findById(productId);
                
                //     // Check if the requested quantity exceeds the available stock for the size
                //     if (product && product.stock[size] < quantity) {
                //         console.log(`Sorry, ${size} size has only ${product.stock[size]} product(s) available.`);
                //         continue; // Skip processing this item further
                //     }

                // }


                
                userData.products.forEach(pro=>{
                    totalprice=+pro.total_price
                })

                
                    totalstock=product.productId.stock.XS+product.productId.stock.S+product.productId.stock.M+product.productId.stock.L+product.productId.stock.XL+product.productId.stock.XXL
                    
                
                if(qty>totalstock)
                {
                    // res.redirect(`/product/cart?msg=out of Stock This product Have Only ${totalstock} `)
                    // res.render('users/cart',{cart:userData,msg:`Out of Stock This product Have Only ${totalstock}`,totalprice})
                        return res.status(400).json({ error: `Out of Stock. This product has only ${totalstock} available.` });

                }else
                {
                    
                    product.quantity=qty

                    const totalPrice = product.productId.promo_price * qty;
                    product.total_price=totalPrice
                   
                    console.log("quantity of :",product.quantity);
                
                    const saving=await userData.save()
                    if(saving)
                    // res.redirect('/product/cart')
                    res.status(200).json({ success: true ,totalPrice:totalPrice});
                    else
                    res.status(500).json({ success: false, error: "Failed to update quantity" });
                }
            }
        }
    }

        
    } catch (error) {
        
        console.log("error from cartController ChangeQuantity",error);
    }
}

// const ChangeQuantity = async (req, res) => {
//     try {
//         console.log("entering change Quantity");
//         const productId = req.query.id;
//         const userId = req.session.user._id;
//         const qty = parseInt(req.body.qty);
//         const userData = await Cart.findOne({ userId: userId }).populate({ path: 'products.productId', populate: [{ path: 'category' }] });

//         console.log("product id fromm", productId);
//         console.log("qty id fromm", qty);

//         if (!userData) {
//             return res.redirect('/product/cart');
//         }

//         const product = userData.products.find((pro) => pro.productId._id.toString() === productId);
//         console.log("product iddd ", product);

//         if (!product) {
//             console.log("no product ");
//             return res.redirect('/product/cart');
//         }

//         let totalprice = 0;
//         userData.products.forEach(pro => {
//             totalprice += pro.total_price;
//         });

//         let totalstock = product.productId.stock.XS + product.productId.stock.S + product.productId.stock.M + product.productId.stock.L + product.productId.stock.XL + product.productId.stock.XXL;

//         if (qty > totalstock) {
//             return res.render('users/cart', { cart: userData, msg: `Out of Stock This product Have Only ${totalstock}`, totalprice });
//         } else {
//             product.quantity = qty;
//             const totalPrice = product.productId.promo_price * qty;
//             product.total_price = totalPrice;

//             console.log("quantity of :", product.quantity);

//             const saving = await userData.save();
//             if (saving) {
//                 res.status(200).json({ success: true, totalPrice });
//             } else {
//                 res.status(500).json({ success: false, error: "Failed to update quantity" });
//             }
//         }

//     } catch (error) {
//         console.log("error from cartController ChangeQuantity", error);
//         res.status(500).json({ success: false, error: "Internal server error" });
//     }
// }


module.exports={
    loadShopCart,
    AddtoCart,
    removeCartProduct,
    clearCart,
    ChangeQuantity
}