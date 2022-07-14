const jwt = require("jsonwebtoken");
const User = require('../model/userModel');
const asyncHandler = require('express-async-handler');

// //protect is the name of the middleware
// const protect = async(req,res,next)=>{
//     //next is used on to the other operation
//     let token;

//     //in our requrest, we r going to send the token inside our headers in the route
//     //token needs to be a bearer token
//     if(req.headers.authoriztion && req.headers.authoriztion.startsWith("Bearer"))
//         {
//             try{
//                 //decoding the token - Bearer 1039asdedar32ed1
//                 token = req.headers.authorization.split(" ")[1];

//                 //after this we will very the same
//                 const decoded = jwt.verify(token,process.env.JWT_SECRET);

//                 //finding the user and returning it without password
//                 req.user = await User.findById(decoded.id).select("password");

//                 //to move to the next operation
//                 next();
//             }
//             catch (err){
//                 res.status(401);
//                 throw new Wrror("Not authorized, no token");
//             }
//         }
//         else
//         {
//             res.status(401);
//             throw new Error("Not authorized, no token")
//         }
//     }

// module.exports={protect};

// const jwt = require("jsonwebtoken");
// const User = require("../models/userModel.js");
// const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  //before moving to the requests, the http request has to go through this custom middleware that has been made and added
  if (

    //this means that if we r sending some token in the headers 
    req.headers.authorization &&

    //Bearer is the key for the token
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

module.exports = { protect };