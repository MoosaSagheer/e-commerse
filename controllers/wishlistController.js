const User = require('../models/usermodel')
const Product = require('../models/products')
const Wishlist = require('../models/wishlistModel')

const loadWishlist = async(req,res) =>{
    try {
        const id = req.session.user._id
        const wishlist = await Wishlist.findOne({userId:id}).populate('products.productId')

        console.log(wishlist?.products?.productId,wishlist?.category,"========");
        res.render('wishList',{wishlist})
    } catch (error) {
        console.log("error from wishlist controller load wishlist",error);
    }
}

const addWishlist = async(req,res) => {
    try {
        
        const userId = req.session.user._id
        const productId = req.query.id

        let productData = await Product.findOne({_id:productId})
        console.log(productData,'==============');
        let wishlistData = await Wishlist.findOne({userId:userId})

        if(!wishlistData){
            wishlistData = new Wishlist({
                userId,
                products: [{productId}]
            })

            const saved = wishlistData.save();

            if(saved){
                console.log("Wishlist is saved");
                res.status(200).redirect('/home');
            } else {
                console.log("not saved")
            }

        } else {
            const sameProduct = wishlistData.products.find(product => product.productId.toString() === productId.toString())

            if(sameProduct){
                res.status(200).redirect('/home')
            } else {
                wishlistData.products.push({productId})
                await wishlistData.save();
                res.status(200).redirect('/home')
            }
        }
    } catch (error) {
        console.log("error from wishlist controller add wishlist",error); 
    }
}


const removeWishlist = async(req,res) => {
    try {
        const id = req.query.id
        const user = req.session.user._id
        const wishlist=   await Wishlist.findOne({userId:user})
   
     if(wishlist){
        const productToDelete = wishlist.products.find(product => product.productId._id.equals(id));
        if (productToDelete) {
        // Remove the product from the wishlist's products array
        const updatedProducts = wishlist.products.filter(product => !product.productId._id.equals(id));
        wishlist.products = updatedProducts;

        // Optionally, save the updated wishlist to the database
        await wishlist.save();
        } else {
        console.error(`Product with ID ${id} not found in wishlist`);
        }

     }
    
       res.status(200).json({success:true})  

    } catch (error) {
        console.log("error from wishlistcontroller delete wishlist")
    }
}


module.exports = {
    loadWishlist,
    addWishlist,
    removeWishlist
}