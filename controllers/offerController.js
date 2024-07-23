
const Product=require('../models/products')
const Category=require('../models/category')
const Offer=require('../models/offerModel')



const loadOffer=async(req,res)=>{
    try {
      const offerData= await Offer.find()
      .populate({path: 'product' })
      .populate({ path: 'category' });





  
      res.render('offer',{offer:offerData})
      
    } catch (error) {
      
      console.log("error from offerController loadOffer",error);
    }
  }



  const loadProductOffer=async(req,res)=>{
    try {

      

      const productData=await Product.find({is_deleted:false})
      // console.log("prdcutct ",productData);

 
        res.render('addProductOffer',{product:productData})


        
    } catch (error) {
        
        console.log("error from offerController loadProductOffer",error);
    }
  }
  

  const addProductOffer=async(req,res)=>{
    try {
      
      console.log("add product renderinggg.");
     const{product,offerName,description,offerPercentage,offerType} =req.body

     console.log("percentage : ",typeof offerPercentage);
     
     const percentage=parseFloat(offerPercentage)
     console.log("percentage : ",typeof percentage);

    //  console.log(req.body);
     const offerdata=await Offer.create({
      product:product,
      offerName:offerName,
      offerDescription:description,
      Discount:percentage,
      offertype:offerType,
      isActive:false

    })
    if(offerdata)
      {

        await offerdata.save()
      //   const updatedProduct = await Product.findByIdAndUpdate(
      //     product,
      //     { $set: { offer: offerPercentage } },
      //     { new: true } // This option returns the updated document
      // );

       console.log("saveddd");
       res.redirect('/admin/offer')
      //  if(updatedProduct)
      //   
       
      //  else
      //  console.log("error for savingg");


      }



    } catch (error) {
      
      console.log("error from offer controllre addProductOfer",error);
      
    }
  }



  const applyOfferByproduct = async(req,res)=>{
    try {


      // const {data}=req.body
      const { offerId, productId, offertype, discount, categoryId } = req.body;
      // const offerId=data.offerId
      
      // const offertype=data.offertype
      console.log("offertype ",offertype);

      console.log("offerId",offerId);

     
      const offerData=await Offer.findByIdAndUpdate(offerId,
        { $set:{isActive:true}  },
        {new:true}

    )
      if(offerData)
        {

          console.log("finded offerData");
          if(offertype==="Product Offer")
            {
              // const productId=data.productId
              console.log("product id ",productId);
              const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                { $set: { offer: offerId } },
                { new: true } // This option returns the updated document
            );
            if(updatedProduct)
              {
                console.log("product updated");
                res.status(200).json({success:true})
                

              }
             

            else{
              res.status(200).json({success:false})
              console.log("product not update");

            }
           
        }
        else if(offertype==="Category Offer")
          {
            // const Discount=data.discount
            // const categoryId=data.categoryId
            const updatedcategory = await Category.findByIdAndUpdate(
              categoryId,
              { $set: { offer: discount } },
              { new: true } // This option returns the updated document
          );
          if(updatedcategory)
            {
              console.log("category updated");
              res.status(200).json({success:true})
              

            }
           

          else{
            res.status(200).json({success:false})
            console.log("category not update");

          }
         

            

          }
              
         } else

        {
          console.log("offer not find");
        }

      
    } catch (error) {
      
      console.log("error from offerController applayOfferByproduct",error);
    }
  }




  // const removeOfferByproduct=async(req,res)=>{
  //   try {
  //     console.log("remove offer renderinggg.");

  //     const {data}=req.body
  //     const offerId=data.offerId
      
      
  //     const offertype=data.offertype
  //     console.log("offertype ",offertype);

  //     console.log("offerId",offerId);


  //     const offerData=await Offer.findByIdAndUpdate(offerId,
  //       { $set:{isActive:false}  },
  //       {new:true}

  //   )
  //     if(offerData)
  //       {
  //         console.log("finded offerData");
  //         if(offertype==="Product Offer")
  //           {
  //             const productId=data.productId
  //             console.log("product id ",productId);
  //             const updatedProduct = await Product.findByIdAndUpdate(
  //               productId,
  //               { $unset: { offer: offerId } },
  //               { new: true } // This option returns the updated document
  //           );
  //           if(updatedProduct)
  //             {
  //               console.log("product updated");
  //               res.status(200).json({success:true})
                

  //             }
             

  //           else{
  //             res.status(200).json({success:false})
  //             console.log("product not update");

  //           }
           
  //       }
  //       else if(offertype==="Category Offer")
  //         {
  //           const Discount=data.discount
  //           const categoryId=data.categoryId
  //           const updatedcategory = await Category.findByIdAndUpdate(
  //             categoryId,
  //             { $unset: { offer: Discount } },
  //             { new: true } // This option returns the updated document
  //         );
  //         if(updatedcategory)
  //           {
  //             console.log("category updated");
  //             res.status(200).json({success:true})
              

  //           }
           

  //         else{
  //           res.status(200).json({success:false})
  //           console.log("category not update");

  //         }
         

            

  //         }
  //       }else

  //       {
  //         console.log("offer not find");
  //       }
      

  //   } catch (error) {
      
  //     console.log("error from offerController removeOfferByproduct",error);
  //   }
  // }

  const removeOfferByproduct = async (req, res) => {
    try {
        console.log("remove offer rendering.");

        const { offerId, productId, offertype, discount, categoryId } = req.body;
        
        console.log("Received data:", req.body);
        console.log("offerId", offerId);
        console.log("productId", productId);
        console.log("offertype", offertype);
        console.log("discount", discount);
        console.log("categoryId", categoryId);

        if (!offerId || !offertype) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const offerData = await Offer.findByIdAndUpdate(offerId, { $set: { isActive: false } }, { new: true });

        if (offerData) {
            console.log("Found offerData");
            if (offertype === "Product Offer") {
                const updatedProduct = await Product.findByIdAndUpdate(
                    productId,
                    { $unset: { offer: offerId } },
                    { new: true }
                );
                if (updatedProduct) {
                    console.log("Product updated");
                    return res.status(200).json({ success: true });
                } else {
                    console.log("Product not updated");
                    return res.status(200).json({ success: false });
                }
            } else if (offertype === "Category Offer") {
                const updatedCategory = await Category.findByIdAndUpdate(
                    categoryId,
                    { $unset: { offer: discount } },
                    { new: true }
                );
                if (updatedCategory) {
                    console.log("Category updated");
                    return res.status(200).json({ success: true });
                } else {
                    console.log("Category not updated");
                    return res.status(200).json({ success: false });
                }
            }
        } else {
            console.log("Offer not found");
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        console.log("Error from offerController removeOfferByproduct", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



  const loadEditOffer=async(req,res)=>{
    try {
      
      const offerId=req.query.offerId

      const offerData=await Offer.findById(offerId)
      .populate({path:'product'})
      .populate({path:'category'})
      console.log("offerDataaa",offerData);

      res.render('editOffer',{offer:offerData})
    } catch (error) {
      
      console.log("error from offer Controller loadEditOffer",error);
    }
  }


  const EditOffer=async(req,res)=>{
    try {

      const offerId=req.query.offerId
      const{offerName,description,offerPercentage} =req.body


      const offerData=await Offer.findByIdAndUpdate(offerId,{
        $set:{fferName:offerName,
          offerDescription:description,
          Discount:offerPercentage
        }
      },

    {new:true})


    if(offerData)
      {
        console.log("updated");

        res.redirect('/admin/offer')
      }
      
    } catch (error) {
      
      console.log("error from offerController EditOfferEditOffer",error);
    }
  }

  const loadAddCategoryOffer=async(req,res)=>{
    try {


      const categoryData=await Category.find()

      res.render('addCategoryOffer',{category:categoryData})
      
    } catch (error) {
      
    }
  }


  const AddCategoryOffer=async(req,res)=>{
    try {

      console.log("add categoryyy renderinggg.");
      const{category,offerName,description,offerPercentage,offerType} =req.body
 
      console.log("percentage : ",typeof offerPercentage);
      
      const percentage=parseFloat(offerPercentage)
      console.log("percentage : ",typeof percentage);
 
     //  console.log(req.body);
      const offerdata=await Offer.create({
       category:category,
       offerName:offerName,
       offerDescription:description,
       Discount:percentage,
       offertype:offerType,
       isActive:false
 
     })
     if(offerdata)
       {
 
         await offerdata.save()
 
         res.redirect('/admin/offer')
       }
      
      
    } catch (error) {
      
      console.log("error from offer controller AddCategoryOffer",error);
    }
  }
  


  module.exports={
    loadOffer,
    loadProductOffer,
    addProductOffer,
    applyOfferByproduct,
    removeOfferByproduct,
    loadEditOffer,
    EditOffer,
    loadAddCategoryOffer,
    AddCategoryOffer


  }