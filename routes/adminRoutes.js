const express=require('express')
const admin_route=express()
const session=require('express-session')
const bodyParser = require('body-parser')


const config=require('../config/config')


admin_route.use(session({
name:'admin_session',
secret:config.sessionSecret,
resave:false,
saveUninitialized:false}))

const path = require('path');

// using the body parser module 
// body parser is a connecting the body of website 
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))

// conmceting view engine file
admin_route.set('view engine' , 'ejs')


// connecting admin folder to views foolder (view engine only working views folder)
admin_route.set('views','./views/admin')



const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/'); // Directory to store the file
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

const upload = multer({ storage: storage }).array('images',5)


// admin_route.use(upload.array('images'));






// connecting created middilware to auth variable 
const auth=require('../middleware/adminAuth')


// middileware connect cheyyunnu 
const adminController=require('../controllers/adminController')
const offerController=require('../controllers/offerController')
const formidable = require('formidable')
const { setNoCacheHeaders } = require('../middleware/auth')


// isLogout = ith logout cheythale keran pattuka ollu
// adminController.loadLogin=  adminController enna middileware le  loadLogin 
// middleware assing cheyyunnu
admin_route.get('/',auth.isLogout,setNoCacheHeaders,adminController.loadLogin)


// admin page
admin_route.post('/',adminController.verifyLogin)


// ithil login cheythale keran pattuka ollu 
admin_route.get('/home',auth.isLogin,adminController.loadDashboard   )
admin_route.get('/ordersgraph',auth.isLogin,adminController.getOrdersGraphData)
admin_route.get('/download-orders-pdf',auth.isLogin,adminController.pdfDownloadOrders)

admin_route.get('/addproduct',auth.isLogin,adminController.addproduct)
admin_route.post('/addproduct',auth.isLogin,upload,adminController.insertproduct)
admin_route.get('/productlist',auth.isLogin,adminController.productList)
admin_route.delete('/product/delete',auth.isLogin,adminController.productDelete)
admin_route.get('/product/add',auth.isLogin,adminController.productAdd)
admin_route.get('/editproduct',auth.isLogin,adminController.editproduct)
admin_route.post('/editproduct',auth.isLogin,upload,adminController.updateProduct)


admin_route.post('/category/add',auth.isLogin,adminController.catagoryAdd)
admin_route.delete('/deletecategory',auth.isLogin,adminController.catagoryDelete)
admin_route.post('/category/editcategory',auth.isLogin,adminController.editcategory)
admin_route.post('/editcategory',auth.isLogin,adminController.updateCategory)
admin_route.get('/category',auth.isLogin,adminController.addCategory)
admin_route.post('/category',auth.isLogin,adminController.insertCategory)
admin_route.get('/delete-image',auth.isLogin,adminController.deleteimage)


admin_route.get('/users',auth.isLogin,adminController.adminDashboard)
admin_route.post('/users',auth.isLogin,adminController.updateUsers)
admin_route.post("/users/unblock",auth.isLogin,adminController.unblock_user)
admin_route.delete("/users/block",auth.isLogin,adminController.block_user)


admin_route.delete('/order/cancel',auth.isLogin,adminController.orderCancel)
admin_route.get('/orders',auth.isLogin,adminController.Loadorder)
admin_route.get('/order/details',auth.isLogin,adminController.orderDetails)
admin_route.post('/order/statusChange',auth.isLogin,adminController.statusChange)

admin_route.get('/offer',auth.isLogin,offerController.loadOffer)
admin_route.get('/offer/product/add',auth.isLogin,offerController.loadProductOffer)
admin_route.post('/offer/product/add',auth.isLogin,offerController.addProductOffer)
admin_route.get('/offer/category/add',auth.isLogin,offerController.loadAddCategoryOffer)
admin_route.post('/offer/category/add',auth.isLogin,offerController.AddCategoryOffer)
admin_route.get('/offer/edit',auth.isLogin,offerController.loadEditOffer)
admin_route.post('/offer/edit',auth.isLogin,offerController.EditOffer)
admin_route.post('/offer/apply',auth.isLogin,offerController.applyOfferByproduct)
admin_route.post('/offer/remove',auth.isLogin,offerController.removeOfferByproduct)

admin_route.get('/coupon',auth.isLogin,adminController.loadCoupon)
admin_route.get('/createcoupon',auth.isLogin,adminController.loadCreateCoupon)
admin_route.post('/coupon',auth.isLogin,adminController.createCoupon)
admin_route.delete("/deletecoupon",auth.isLogin,adminController.deleteCoupon)

admin_route.get('/show',auth.isLogin,adminController.show)

// adding logout button
admin_route.get('/logout',auth.isLogin, adminController.logout)


// admin_route.get('*') means that the defined route handler will be triggered
//  for any GET request made to any path under the /admin route.
// admin_route.get('*',function(req,res){
//     res.redirect('/admin/home')
// })

module.exports=admin_route 