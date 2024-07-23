const express=require('express')
const admin_route=express()

const User = require("../models/usermodel");
const Product = require("../models/products");
const Category = require("../models/category");
const Cart = require("../models/cart")
const order = require('../models/order')
const address= require('../models/address')
const Coupon = require('../models/couponModel')
const PDFDocument = require('pdfkit');
const sharp=require('sharp')
const path = require('path')

const bcrypt = require("bcrypt");

const config = require("../config/config");

const formidable = require("formidable");

function formidableMiddleware(req, res, next) {
    console.log("req body",req.body);
    let form = new formidable.IncomingForm({
        multiples: true,       // Allow multiple file uploads
        keepExtensions: true,   // Keep original file extensions
        allowEmptyFiles: true  // Allow empty files (size 0)
    });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).send("Error parsing form data");
    }

    req.body = fields;
    req.files = files;
    next(); // Continue to the next middleware or route handler
  });
}

const loadLogin = async (req, res) => {
  try {
    console.log("login page render");
    res.render("login");
  } catch (error) {
    console.log(error.message + "admin loadlogin error");
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 1) {
          //     res.render('login',{message:'email address and Password is incorrect'})

          // }
          // else{
          req.session.admin = {
            _id: userData._id,
            email: email,
            name: userData.name,
          };
          req.user = await User.findById({ _id: req.session.admin._id });
          console.log(req.user, " verify login admin controller");
          res.redirect("/admin/home");
        } else {
          res.render("login", { message: "Enter correct details" });
        }
      } else {
        res.render("login", { message: "Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and password is incorrect" });
    }
  } catch (error) {
    console.log(error.message + " admin verifylogin error");
  }
};

const loadDashboard = async (req, res) => {
//   try {
//     const userData = req.session.admin.name;
//     console.log(userData);
//     res.render("home", { admin: userData });
//   } catch (error) {
//     console.log(error.message + " admin Load Dashboard error");
//   }
// };
try {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  

  const pastRevenue = await order.aggregate([
      { $match: { 'date': { $gte: thirtyDaysAgo, $lt: today } } },
      { $unwind: "$products" },
      { $match: { 'createdAt': { $gte: thirtyDaysAgo, $lt: today } } },
      {
          $group: {
              _id: null,
              totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
          }
      }
  ]);

  const pasttotalRevenue = pastRevenue.length > 0 ? pastRevenue[0].totalRevenue : 0;
  // console.log("Total Revenue in the Last 30 Days:", pasttotalRevenue);

  const result = await order.aggregate([
      { $unwind: "$products" },
      { $count: "totalProductsCount" }
  ]);

  const totalProductsCount = result.length > 0 ? result[0].totalProductsCount : 0;
  // console.log("Total Count of Products:", totalProductsCount);

  const completedProducts = await order.aggregate([
      { $match: { "orderStatus": "Delivered" } }
  ]);

  const unique = await order.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products.productId" } },
      { $count: "uniqueProductCount" }
  ]);

  const uniqueProductCount = unique.length > 0 ? unique[0].uniqueProductCount : 0;
  // console.log("Unique Product Count:", uniqueProductCount);

  let totalRevenue = 0;
  // console.log("Completed Products:", completedProducts);

  completedProducts.forEach(product => {
      totalRevenue += product.price;
      console.log("Product Price:", product.price);
  });

  // console.log("Total Revenue", totalRevenue);
// Pagination variables
let page = parseInt(req.query.page) || 1;
const limit = 5;
const skip = (page - 1) * limit;;



  const { startDate, endDate, predefinedRange } = req.query;
  let dateFilter = {};

  const calculatePredefinedRange = (range) => {
      const now = new Date();
      let start, end = new Date();

      switch (range) {
          case 'oneDay':
              start = new Date(now.setDate(now.getDate() - 1));
              break;
          case 'oneWeek':
              start = new Date(now.setDate(now.getDate() - 7));
              break;
          case 'oneMonth':
              start = new Date(now.setMonth(now.getMonth() - 1));
              break;
          case 'oneYear':
              start = new Date(now.setFullYear(now.getFullYear() - 1));
              break;
          default:
              return null;
      }

      end.setHours(23, 59, 59, 999);
      return { start, end };
  };

  if (predefinedRange) {
    const range = calculatePredefinedRange(predefinedRange);
    if (range) {
      dateFilter = {
        createdAt: {
          $gte: range.start,
          $lte: range.end
        }
      };
    }
  } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
          }
      };
  } else if (startDate) {
      dateFilter = {
        createdAt: {
              $gte: new Date(startDate),
              $lt: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 1))
          }
      };
  }


const orders = await order.aggregate([
{ $unwind: "$products" },
{ $match: dateFilter },
{
  $group: {
    _id: "$_id",
    userId: { $first: "$userId" },
    products: { $push: "$products" },
    totalPrice: { $first: "$totalAmount" },
  //   address: { $first: "$address" },
    payment_method: { $first: "$payment_method" },
    orderStatus:{$first:"$orderStatus"},
    date: { $first: "$createdAt" },
  //   updatedAt: { $first: "$updatedAt" }
  }
},
{
  $lookup: {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: 'userDetails'
  }
},
{ $unwind: "$userDetails" },
  { $skip: skip },
  { $limit: limit }
])  
console.log("orders",orders);


const totalOrders = await order.countDocuments(dateFilter);
// console.log("total order",totalOrders);
// const totalPages = Math.ceil(totalOrders / limit);
const totalPages = totalOrders > 0 ? Math.ceil(totalOrders / limit) : 0;  // Handle empty results
// console.log("total pages ",totalPages);


if (!orders || orders.length === 0) {
res.render('home', {
  order: [],
  totalProductsCount,
  totalRevenue: 0, // Set to 0 if no orders found
  pasttotalRevenue,
  uniqueProductCount,
  message: 'No orders found for the selected date range',
  currentPage: page,
  totalPages: totalPages,
  limit: limit
});

  } else {
      const categoryOrders = await order.aggregate([
          { $unwind: '$products' },
          {
              $group: {
                  _id: '$products.productId',
                  productCount: { $sum: '$products.quantity' },
              },
          },
          {
              $lookup: {
                  from: 'products',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'productDetails'
              }
          },
          { $unwind: '$productDetails' },
          {
              $group: {
                  _id: '$productDetails.category',
                  productCount: { $sum: '$productCount' }
              }
          }
      ]);

      res.render('home', {
          order: orders,
          totalProductsCount,
          totalRevenue,
          pasttotalRevenue,
          uniqueProductCount,
          categoryOrders,
          currentPage: page,
          totalPages: totalPages,
          limit: limit
      });
  }
    
        console.log("dashbord rendering");
      } catch (error) {
        console.log("admin controll LoadDashboard error", error);
      }

}
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
//To add product

const addproduct = async (req, res) => {
  try {
    const category = await Category.find({});

    if (category !== undefined) {
      res.render("product", {
        categories: category,
        message: "Enter the details of product",
      });
      // res.render('home')
    } else {
      console.log("cant fetch category");
      res.redirect("/product");
    }
  } catch (error) {
    console.log("add product error ");
    console.log(error.message);
  }
};

// To add category

const addCategory = async (req, res) => {
  try {

    var search = "";
    if(req.query.search){
      search = req.query.search;
    }

    let page = parseInt(req.query.page) || 1;
    let limit = 2;

    let startIndex = (page-1) * limit; 


    let cat= await Category.find({$or: [{maincatagory: {$regex: search, $options: "i"}}]}).skip(startIndex).limit(limit);
    let totalDocuments = await Category.countDocuments();
    console.log(cat,"sdfgbhjm");
    let totalPages = Math.ceil(totalDocuments/limit)
    res.status(200).render("category",{categories:cat,page,totalPages});
  } catch (error) {
    console.log("contact error ");
    console.log(error.message);
  }
};

// insert category

const insertCategory = async (req, res, next) => {
  try {
    const { mainCategory, subCategory, description } = req.body;
    console.log(mainCategory, subCategory, description);
    // 1. Data Validation
    if (!mainCategory || !subCategory || !description) {
      return res
        .status(400)
        .json({ error: "Required fields missing or invalid" });
    }

    // 2. Check for Existing Category (Optional but recommended for uniqueness)
    // 
    const existingCategory = await Category.findOne({
      maincatagory: { $regex: new RegExp(`^${mainCategory}$`, 'i') } // Case-insensitive regex
    });
    if (existingCategory) {
      var search="";
    
      console.log("category indedaaa");
      // const cat= await Category.find({})
      let page = parseInt(req.query.page) || 1;
      let limit = 2;
  
      let startIndex = (page-1) * limit;
  
  
      let cat= await Category.find({$or: [{maincatagory: {$regex: search, $options: "i"}}]}).skip(startIndex).limit(limit);
      let totalDocuments = await Category.countDocuments();
  
      let totalPages = Math.ceil(totalDocuments/limit)
      res.status(200).render("category",{message: "Category already exist",categories:cat,page,totalPages});


      // return res.render("category", { message: "Category already exist",categories:cat });
    }
    else{

    // 3. Create Category Instance
    console.log("instance");
    const category = new Category({
      description: description,
      maincatagory: mainCategory,
      subcatagory: subCategory,
    });

    // 4. Save Category
    console.log("save category");
    const savedCategory = await category.save();
    // const cat= await Category.find({})

    // 5. Success Response
    var search="";
    
      console.log("category indedaaa");
      // const cat= await Category.find({})
      let page = parseInt(req.query.page) || 1;
      let limit = 2;
  
      let startIndex = (page-1) * limit;
  
  
      let cat= await Category.find({$or: [{maincatagory: {$regex: search, $options: "i"}}]}).skip(startIndex).limit(limit);
      let totalDocuments = await Category.countDocuments();
  
      let totalPages = Math.ceil(totalDocuments/limit)
      res.status(200).render("category",{message: "Category added successfully",categories:cat,page,totalPages});

    // return res.render("category", { message: "Category added successfully" ,categories:cat});
  }
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Error adding category" });
  }
};

// // insert product

const insertproduct = async (req, res, next) => {
  try {
    console.log("insertproduct", req.body);
    const category1 = await Category.find({});


    const {
      name,
      description,
      price,
      promoprice,
      category,
      sizes,
    } = req.body;
    console.log(name, description, price, promoprice, category, sizes);

const existing = await Product.findOne({ name });  
console.log(existing);
if(existing){
  return res.render("product", { 
    categories: category1, 
    message: "Product already exists" 
  });
} 

    // 2. Check for image uploads
  // CHECK HERE FOR ERRORS

    let imageUrls;
    if (req.files && req.files.length > 0) {
      
      imageUrls = await req.files.map((file) => file.filename);
    }

    console.log("image urlss : ", imageUrls);

    // 3. Create Product Instance

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      promoprice: parseFloat(promoprice),
      category,
      sizes: Object.entries(sizes).map(([size, data]) => ({
        size,
        stock: parseInt(data.stock, 10) || 0,
      })),
      images: imageUrls,
    });



    // 4. Save Product
    console.log("insert product save");
    const savedProduct = await product.save();
    console.log(savedProduct);
    // 5. Success Response

    if (category !== undefined && category1) {
      console.log("res.render(productlist")
      return res.render("product", {
        categories: category1,
        message: "Product added successfull",
      });
    } else {
      res.redirect("/admin/productlist");
    }
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Error adding product" });
  }
}; 



const adminDashboard = async (req, res) => {
  try {

    var search =''
    if(req.query.search){
      search = req.query.search;
    }

    let page = parseInt(req.query.page) || 1;
    let limit = 4;

    let startIndex = (page-1) * limit;

    // const userData = await User.find({ is_admin: 0 });

    let userData= await User.find( {is_admin: 0 ,$or: [{name: {$regex: search, $options: "i"}}]}).skip(startIndex).limit(limit);
    let totalDocuments = await User.countDocuments();
    console.log(userData,"sdfgbhjm");
    let totalPages = Math.ceil(totalDocuments/limit)    
    console.log(userData);
    res.status(200).render("userslist", { users: userData ,page,totalPages});
    // console.log("node js "+users.length);
  } catch (error) {
    console.log(error.message + "adimin error from adminDashboard");
  }
};

// adding new user
const newUserLoad = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};

// password hasing
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message + "user securePassword Error");
  }
};

const addUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mno;
    const password = req.body.password;

    const sPassword = await securePassword(password);
    console.log(sPassword);

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      password: sPassword,
      is_admin: 0,
    });
    console.log("ividethi");
    const userData = await user.save();

    if (userData) {
      res.redirect("/admin/home");
    } else {
      res.render("new-user", { message: "something wrong " });
    }
  } catch (error) {
    console.log(error.message + "error from Add user");
  }
};

// editing user
const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit-user", { users: userData });
    } else {
      res.redirect("/admin/home");
    }
  } catch (error) {
    console.log(error.message + "Admin error from edituserload");
  }
};

// if u edit the user and that edit  wnant to uplode
const updateUsers = async (req, res) => {
  try {
    // connecting mongpodb in with id . id name of edit user ejs file eg:   name is   mongodb document field and  req.body.name is the what is that inside of input tag
    // req.body. name is that name is = the name of the input tag
    console.log("nannavadaaa");
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: { is_blocked: true } }
    );
    if (userData) {
      res.redirect("/admin/home");
    } else {
      res.render("user-edit", { message: "somthing wrong" });
    }
  } catch (error) {
    console.log(error.message + "Admin error from updteUserse");
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.deleteOne({ _id: id });
    if (userData) {
      res.redirect("/admin/home");
    } else {
      res.redirect("/admin/home", {
        message: "somthing wrong about deleting user",
      });
    }
  } catch (error) {
    console.log(error.message + "admin error from deleting User");
  }
};

const unblock_user = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findByIdAndUpdate(id, {
      $set: { is_blocked: false },
    });
    const saving = await userData.save();
    if (saving) {
      console.log("unblocked user");
      res.redirect("/admin/users");
    } else {
      console.log("unblock problemsmmm ");
    }
  } catch (error) {
    console.log("erron from admin controller unblock_user", error);
  }
};

const block_user = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findByIdAndUpdate(id, {
      $set: { is_blocked: true },
    });
    
    const saving = await userData.save();

    if (saving) {
      console.log("blocked user");
     res.status(200).json({success:true})
    } else {
      console.log("block problemsmmm ");
    }
  } catch (error) {
    console.log("erron from admin controller block_user", error);
  }
};

const show = async (req, res) => {
  try {
    const product = await Product.find({});
    const category = await Category.find({});

    console.log(product, category);
    res.render("demo", { product: product, category: category });
  } catch (err) {
    console.log(err, "show error");
  }
};

const productList = async (req, res) => {
  try {
    var search =''
    if(req.query.search){
      search = req.query.search;
    }
    console.log("reached product list ");
    var page = 1;
    const limit = 2;
    if (req.query.page) {
      page = req.query.page;
    }
    const products = await Product.find({$or: [{name: {$regex: search, $options: "i"}}]})
      .populate("category")
      .sort({createdAt:-1})
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    //  console.log(products);
    const count = await Product.find({}).populate("category").countDocuments();

    console.log(count, "count");

    res.render("productlist", {
      products,
      totalpage: Math.ceil(count / limit),
      // currnet page ariyan
      currentpage: page,
      // next pagilott poovan
      nextpage: page + 1,
      search
    });
    // res.render('productlist',{products:product,totalpage:totalpage})
  } catch (error) {}
};

const productDelete = async (req, res) => {
  try {
    if (req.query.id) {
      const id = req.query.id;
      console.log(id, "id passing successfull");
      const userData = await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { is_deleted: true } }
      );
      const saving = await userData.save();
    }
    res.status(200).json({success:true});
  } catch (error) {
    console.log(error, "pdelete error");
  }
};

const productAdd = async (req, res) => {
  try {
    if (req.query.id) {
      const id = req.query.id;
      console.log(id, "id passing successfull");
      const userData = await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { is_deleted: false } }
      );
      const saving = await userData.save();
    }
    // res.status(200).json({success:true});

    res.redirect("/admin/productlist");
  } catch (error) {
    console.log("product add error");
  }
};

// // edit product

const editproduct = async (req, res, next) => {
  try {
    // console.log(req.body);
    const data = await Product.findById(req.query.id);

    const category1 = await Category.find({});

    if (category1 !== undefined) {
      res.render("ep", {
        data: data,
        categories: category1,
        message: "",
      });
    } else {
      res.redirect("/productlist");
    }
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Error adding product" });
  }
};






const updateProduct = async (req, res) => {
    // console.log(req.body);
    if(req.body.name){
  try {
    let updatedImages=[]
    console.log("Edit Product Body ====================")
    console.log("bodyil ullath",req.body); // 1. Get Product ID from form data


    const id1 = req.body.id; // 2. Get other form data from req.body
    const id=id1[0]
    const P_name = req.body.name;
    const p_description = req.body.description;
    const p_Aprice = parseFloat(req.body.price);
    const p_Pprice = parseFloat(req.body.promoprice);
    const P_category = req.body.category; // 3. Handle Image Updates (if any) // const p_images = req.files.images.length > 0 //     ? req.files.images.map((file) => file.filename) //     : []; // Handle if no new images are uploaded // 4. Find Category and Stock Data

    const findCategory = await Category.findOne({ _id: P_category });
   
    // Parse sizes correctly 
    const sizes = JSON.parse(req.body.sizes['']); 
    console.log(sizes,"sizes parsed as objects");
    

    const product=await Product.find({_id:id})
    if (req.files && req.files.length > 0) {
      var newImageNames = req.files.map((file) => file.filename);
      console.log("updatedimages",updatedImages);
     
    }
    if(newImageNames?.length>0){
    const image =await Product.updateOne(
      { _id: id }, 
      { $push: { images: { $each: [...newImageNames] } } }
   )
  }
    
    console.log("image urlss : ", updatedImages);

    
    // 5. Update Product in Database (Atomic Update with $set)

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: P_name,
          description: p_description,
          price: p_Aprice,
          promoprice: p_Pprice,
          category: findCategory._id, // images: p_images, // Update only if new images are uploaded
          sizes: sizes

        },
      },
      { new: true }
    ); // Get the updated product document // 6. Error Handling

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    } // 7. Send Success Response

    res.json({ updated: true, product: updatedProduct });
  }
catch (error) {
    console.error("Error from product controller updateProduct:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the product" });
  }}
  else{
    console.log("errorrr");
    res.redirect('/admin')
  }
};




const editProductPost=async(req,res)=>{
  try {
    console.log(req.files);
    const {data}=req.body
    console.log("data",data.name);
    console.log("Edit Product Body ====================")
    console.log("bodyil ullath",req.body); // 1. Get Product ID from form data
    
    const id = data.id; // 2. Get other form data from req.body

    const P_name = data.name;
    const p_description = data.description;
    const p_Aprice = parseFloat(data.price);
    const p_Pprice = parseFloat(data.promoprice);
    const P_category = data.category; // 3. Handle Image Updates (if any) // const p_images = req.files.images.length > 0 //     ? req.files.images.map((file) => file.filename) //     : []; // Handle if no new images are uploaded // 4. Find Category and Stock Data

    const findCategory = await Category.findOne({ _id: P_category });
    const sizes = data.sizes // Create an object to hold stock data
     const product = await Product.findById(id);
    console.log("ivide vere ethunind");
    if (req.files && req.files.length > 0) {
      console.log("if conditionil keri");
      const images =await req.files.map((file) => file.filename);
      console.log("image verunindo",images);
      const updatedProduct = await Product.updateOne(
        { _id: id },
        { $push: { images: { $each: images } } }
      ); 
      // updatedProduct.save()
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: P_name,
          description: p_description,
          price: p_Aprice,
          promoprice: p_Pprice,
          category: findCategory._id, // images: p_images, // Update only if new images are uploaded
          sizes: sizes,
        },
      },
      { new: true }
    ); // Get the updated product document // 6. Error Handling

   

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    } // 7. Send Success Response

    res.json({ updated: true, product: updatedProduct });
  
  } catch (error) {
    
    console.log("error from admin controller editProductPost",error);
  }
}


const deleteimage=async (req,res)=>{
  try {
    console.log(req.query.index);
    const index=req.query.index
    const id=req.query.id
    const product=await Product.findById(id)

    product.images.splice(index, 1);

    // 3. Update the product in the database
    await Product.findByIdAndUpdate(id, { images: product.images });
    const url=`http://localhost:3000/admin/editproduct?id=${id}`
    res.redirect(url);
  } catch (error) {
    console.log("deleteimage error",error);
  }
}

const catagoryAdd=async (req,res)=>{
  try {
    if (req.query.id) {
      const id = req.query.id;
      console.log(id, "id passing successfull");
      const userData = await Category.findByIdAndUpdate(
        { _id: id },
        { $set: { is_Deleted: false } }
      );
      const d1 = await Product.updateMany({ category: id }, { $set: { is_deleted: false } });
      

      const saving = await userData.save();
    }
    res.redirect("/admin/category");

  } catch (error) {
    console.log("error from cadd");
  }
}


const catagoryDelete=async (req,res)=>{
  try {
    if (req.query.id) {
      const id = req.query.id;
      console.log(id, "id passing successfull");
      const userData = await Category.findByIdAndUpdate(
        { _id: id },
        { $set: { is_Deleted: true } }
      );
      // const dAll= await Product.find({}).populate('Category')
      // const d1 = await Product.find({category: id}, { $set: { is_deleted: true } });
      try {
        const result = await Product.updateMany({ category: id }, { $set: { is_deleted: true } });
        console.log(`${result.modifiedCount} products were marked as deleted.`);
      } catch (error) {
        console.error("Error updating products:", error);
      }
      
      
      const saving = await userData.save();
    }
    
    res.status(200).json({success:true});
  } catch (error) {
    console.log("error from cdelete");
  }
}


const editcategory=async (req,res)=>{
  try {
    const id=req.query.id
    const cat= await Category.find({})
    const data= await Category.findById(id)
    res.render("editcategory",{categories:cat,data:data});
    
  } catch (error) {
    console.log("edit category");
  }
}



const updateCategory=async (req,res)=>{
  try {
    var search = "";
    if(req.query.search){
      search = req.query.search;
    }

    let page = parseInt(req.query.page) || 1;
    let limit = 2;

    let startIndex = (page-1) * limit;


    let cat= await Category.find({$or: [{maincatagory: {$regex: search, $options: "i"}}]}).skip(startIndex).limit(limit);
    let totalDocuments = await Category.countDocuments();
    console.log(cat,"sdfgbhjm");
    let totalPages = Math.ceil(totalDocuments/limit)
    id=req.query.id
    const { mainCategory, subCategory, description } = req.body;
    console.log(mainCategory, subCategory, description);
    const existingCategory = await Category.findOne({
      maincatagory:mainCategory
    });
    console.log(existingCategory,"asdfghjklmnb");
    const Target = await Category.findById(id);
    // console.log("both category matching check",Target._id.toString(),existingCategory._id.toString());
      
    if (existingCategory != Target && existingCategory !=null){
    const cat= await Category.find({})

      res.render("category", { message: "Category already exist",categories:cat,totalPages,page });

    }
    else{
    const updated= await Category.findByIdAndUpdate(id,{$set:{maincatagory:mainCategory,subcatagory:subCategory,description}},{new:true})

    res.redirect('/admin/category')
    }
    
  
  } catch (error) {
    
  }
}


const cartload=async (req,res)=>{
try {
  if(req.session?.user?._id){
    id=req.session.user._id
  }
  else{
    id=req.session.passport.user._id
  }
  const cart= await Cart.findOne({userId:id}).populate('products.productId')
  res.render('cart',{cart})
} catch (error) {
  console.log(error,"catch from cartload");
}
}

const Loadorder= async (req,res)=>{
  try {
    let ad=[]
    let page = parseInt(req.query.page) || 1;
    let limit = 2;

    let startIndex = (page-1) * limit;


    // let cat= await order.find().skip(startIndex).limit(limit);
    let totalDocuments = await order.countDocuments();
    // console.log(cat,"sdfgbhjm");
    let totalPages = Math.ceil(totalDocuments/limit)
    const orderData = await order.find({}).skip(startIndex).limit(limit).populate('userId').populate('products.productId')
  //   orderData.forEach(async order=>{
  //   const Address = await address.findOne({ 'address._id': order.shippingAddress });    
  //   Address.address.forEach(address=>{
  //       if(address._id.toString()===order.shippingAddress.toString()){

  //            ad.push(address)
  //            console.log(ad,address,"=========address==========");
  //       }
  //   })  
  // })
    res.render('orders',{orderData,page,totalPages})
    
  } catch (error) {
    console.log("error from loadorder admin controller",error);
  }
}


const orderDetails=async (req,res)=>{
  try {
    id=req.query.id
    const orders=await order.findById(id).populate('products.productId').populate('userId')
    const Address = await address.findOne({ 'address._id': orders.shippingAddress });    
        Address.address.forEach(address=>{
            if(address._id.toString()===orders.shippingAddress.toString()){

                 ad=address
                 console.log(ad,address,"=========address==========");
            }
        }) 
        res.render('orderdetails',{order:orders,Address:ad})

  } catch (error) {
    console.log("error from admincontroller orderDetails",error);
  }
}



async function statusChange(req, res) {
  try {
    const orderId = req.query.id;
    const newStatus = req.body.status;

    // Input Validation (important for security)
    if (!orderId || !newStatus) {
      return res.status(400).json({ error: 'Missing order ID or new status.' });
    }

    if (![ "Processing", "Shipped", "Delivered", "Cancelled","Return pending",'Return successful'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }
  let updatedOrder=false
    if(newStatus=='Delivered'){
    // Update Order in Database
     updatedOrder = await order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: newStatus, paymentStatus: 'Paid' } },
      { new: true } // Return the updated document
    );
  }else{
    updatedOrder = await order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: newStatus } },
      { new: true } // Return the updated document
    );
  }

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Optional: Trigger any necessary actions based on the new status
    // For example, send email notifications, update inventory, etc.
    // ... your logic here ...

    res.json({ success: true, updatedOrder }); 
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: 'Internal Server Error' }); 
  }
}




const orderCancel= async (req,res)=>{
  try {
    const id = req.query.id
    const updatedOrder = await order.findByIdAndUpdate(
      id,
      { $set: { orderStatus: "Cancelled" } },
      { new: true } // Return the updated document
    );
    return res.status(200).json({success:true})
  } catch (error) {
    console.log("Error from admin controller at order cancel",erreo);
  }
}

function getStartDate(interval) {
  // Get the current date
  const currentDate = new Date();

  // Initialize variables to store start date
  let startDate;

  // Determine the start date based on the selected interval
  switch (interval) {
      case 'yearly':
          startDate = new Date(currentDate.getFullYear(), 0, 1); // First day of the current year
          break;
      case 'monthly':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First day of the current month
          break;
      case 'weekly':
      default:
          // Calculate the start date for the beginning of the current week (Sunday)
          const firstDayOfWeek = currentDate.getDate() - currentDate.getDay();
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDayOfWeek);
          break;
  }
console.log(startDate);
  return startDate;
}


const getOrdersGraphData = async (req, res) => {
  try {
    const interval = req.query.interval || 'monthly';
    const startDate = getStartDate(interval);

   
    let groupId;
    let dateFormat;

    switch (interval) {
        case 'yearly':
            groupId = { year: { $year: '$createdAt' } };
            dateFormat = { $concat: [{ $toString: "$_id.year" }] };
            break;
        case 'monthly':
            groupId = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
            dateFormat = {
                $concat: [
                    { $toString: "$_id.month" },
                    "/",
                    { $toString: "$_id.year" }
                ]
            };
            break;
        case 'weekly':
        default:
            groupId = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
            dateFormat = {
                $concat: [
                    { $toString: "$_id.day" },
                    "/",
                    { $toString: "$_id.month" },
                    "/",
                    { $toString: "$_id.year" }
                ]
            };
            break;
    }

    console.log("group id", groupId);
    console.log("date format", dateFormat);

    
        const orders = await order.aggregate([
          //   { $unwind: "$products" },
            { $match: { "createdAt": { $gte: startDate } } },
            {
                $group: {
                    _id: groupId,
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    date: dateFormat
                }
            },
            {
                $project: {
                    _id: 0,
                    date: 1,
                    totalOrders: 1
                }
            },
            { $sort: { 'date': 1 } }
        ]);
        console.log(orders,"orders================");
        const labels = orders.map(order => order.date);
        const values = orders.map(order => order.totalOrders);

        console.log("labels: ", labels);  // Debugging log
        console.log("values: ", values);  // Debugging log


        
   res.json({ labels, values });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};


const pdfDownloadOrders = async (req, res) => {
  try {
      const { startDate, endDate, predefinedRange } = req.query;
      let start, end;

      // Determine the date range
      if (predefinedRange) {
          switch (predefinedRange) {
              case 'oneDay':
                  start = new Date();
                  start.setDate(start.getDate() - 1);
                  end = new Date();
                  break;
              case 'oneWeek':
                  start = new Date();
                  start.setDate(start.getDate() - 7);
                  end = new Date();
                  break;
              case 'oneMonth':
                  start = new Date();
                  start.setMonth(start.getMonth() - 1);
                  end = new Date();
                  break;
              case 'oneYear':
                  start = new Date();
                  start.setFullYear(start.getFullYear() - 1);
                  end = new Date();
                  break;
              default:
                  throw new Error('Invalid predefined range');
          }
      } else {
          if (startDate) {
              start = new Date(startDate);
          }
          if (endDate) {
              end = new Date(endDate);
          }
      }

      // Query to fetch orders based on date range
      const query = {};
      if (start && end) {
          query.createdAt = { $gte: start, $lte: end };
      }

      const orders = await order.find(query)
          .populate('userId')
          .populate('shippingAddress')
          .populate('products.productId'); // Populate product details

      // Create a PDF document
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=orders_report.pdf');

      // Pipe the PDF into the response
      doc.pipe(res);

      // Add Header
      doc.fontSize(20).text('Orders Report', { align: 'center' });
      doc.fontSize(12).text(`Date: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });
      doc.moveDown();

      // Add table header
      doc.fontSize(10);
      doc.fillColor('#444444');
      doc.text('Order ID', 50, 100, { bold: true });
      doc.text('User', 100, 100, { bold: true });
      doc.text('Date', 200, 100, { bold: true });
      doc.text('Total Amount', 300, 100, { bold: true });
      doc.text('Status', 400, 100, { bold: true });
      doc.text('Products', 500, 100, { bold: true });
      doc.moveTo(50, 120).lineTo(550, 120).stroke();
      let y = 130;

      // Add orders data
      orders.forEach(order => {
          if (y > 750) { // Check for page overflow
              doc.addPage();
              y = 50;
          }

          doc.fillColor('#000000');
          doc.text(order.orderId, 50, y);
          doc.text(order.userId.name, 100, y);
          doc.text(order.createdAt.toISOString().split('T')[0], 200, y);
          doc.text(`Rs ${order.totalAmount}`, 300, y);
          doc.text(order.orderStatus, 400, y);

          // List products
          let productsText = order.products.map(product => `${product.productId.name} `).join(', ');
          doc.text(productsText, 500, y, { width: 200 });

          y += 20;

          if (order.shippingAddress) {
              const address = order.shippingAddress;
              doc.text(`Address: ${address.name}, ${address.street}, ${address.city}, ${address.state}, ${address.country}`, { indent: 50, width: 500 });
              doc.text(`Pincode: ${address.pincode}`, { indent: 50, width: 500 });
              doc.text(`Mobile No: ${address.mobile}`, { indent: 50, width: 500 });
              y += 40;
          }
      });

      // Add Footer
      doc.moveTo(50, 750).lineTo(550, 750).stroke();
      doc.fontSize(10).text('Generated by Ecommerce System', 50, 760, { align: 'center' });

      // Finalize the PDF and end the stream
      doc.end();

  } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Internal Server Error');
  }
};

const loadCoupon = async(req, res) => {
  try {

      var search = "";

      if (req.query.search) {
        search = req.query.search;
      }
      
      const coupons = await Coupon.find({$or: [{ code: { $regex: search, $options: "i" } }]})
      res.render('couponList',{message:'',coupons}); // Replace with your EJS template name
  } catch (error) {
      console.log("error from admincontroller load coupon");
  }
}

// Route to handle coupon creation form submission (POST /coupons)
const createCoupon = async (req,res)=>{
const { code, discountType, discountValue, isActive, startDate, endDate, minimumOrderAmount, description, products, categories } = req.body;

// Basic validation (consider using a validation library like Joi for more complex validation)
if (!code || code.length < 5) {
  return res.status(400).render('coupon', { message: 'Coupon code must be at least 5 characters long' });
}

// Convert product and category strings to arrays (if provided)
const productIds = products ? products.split(',').map(id => id.trim()) : [];
const categoryList = categories ? categories.split(',').map(cat => cat.trim()) : [];

try {
  console.log("create coupon try");
  // Create a new coupon document
  const newCoupon = new Coupon({
    code,
    discountType,
    discountValue,
    isActive: isActive === 'on', // Handle checkbox value conversion
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    minimumOrderAmount,
    description,
    products: productIds,
    categories: categoryList
  });
console.log("create coupon save");
  // Save the new coupon and handle errors
  await newCoupon.save();
  return res.status(200).json({success:true});
  // res.redirect('/admin/coupon');
   // Redirect to coupon list page (replace with your desired redirect)
} catch (error) {
  console.error(error);
  res.status(500).render('coupon', { message: 'Error creating coupon' });
}
}


const deleteCoupon = async (req,res) => {
  try {
      const id = req.query.id
      console.log("coupon ethi");
      const updated = await Coupon.deleteOne({_id:id})
      if(updated){
      res.status(200).json({success:true})
      }
  } catch (error) {
      console.log("error from admin controller delete coupon",error);
  }
}

const loadCreateCoupon= async (req,res)=>{
  try {
      res.render('coupon')
  } catch (error) {
      console.log("load create coupon");
  }
  
  }







module.exports = {
  updateProduct,
  deleteCoupon,
  loadCoupon,
  loadCreateCoupon,
  createCoupon,
  editproduct,
  productAdd,
  productDelete,
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  adminDashboard,
  newUserLoad,
  addUser,
  editUserLoad,
  updateUsers,
  deleteUser,
  addproduct,
  insertproduct,
  unblock_user,
  block_user,
  addCategory,
  insertCategory,
  show,
  productList,
  formidableMiddleware,
  editProductPost,
  deleteimage,
  catagoryAdd,
  catagoryDelete,
  editcategory,
  updateCategory,
  cartload,
  Loadorder,
  orderDetails,
  statusChange,
  orderCancel,
  getOrdersGraphData,
  pdfDownloadOrders
  
};
