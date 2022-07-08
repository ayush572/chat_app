const express = require('express');
const { chatarea } = require('./data');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const User = require('./model/userModel');
const jwt = require('jsonwebtoken');
//this package will automatically handle the async errors for us
const asyncHandler = require('express-async-handler')
dotenv.config();
connectDB();
const app = express();

//as we are sending the data from the frontend, hence in order to accept the json data from frontend
//we have to specify the same  
app.use(express.json());

function generateToken(id){
    //signing or creating a new token with a particular unique id 
    return jwt.sign({id},process.env.JWT_SECRET,{
        //in how much time does this token expires
        //this is done because as these are the credentials, we shouldn't
        //keep the token longer than required
        expiresIn: "30d" //30 days
    });
}
//http requests
app.get('/',(req,res)=>{
    res.send("API is running")
})

//for registering the users
app.post('/api/user',asyncHandler(async(req,res)=>{
    //all the names written here have to be same as the names in the database
    const {name, password, email, pic} = req.body;
    if( !name && !password && !email){
        res.status(400);
        throw new Error('Please enter all the Fields')
    }
    
    //this is a mongodb query to find if the user exists in the database
    const userExists = await User.findOne({email});
    if(userExists){
        res.status(400);
        throw new Error("User already exists");
    }
    else{

        //this is again a mongodb query for creating a user in the mongodb database
        //will create a new field for a new user, and will return all of the value of name,
        //password, pic and email and id
        const user = await User.create({
            name, email, password, pic
        })
        if(user){
            //here we r sending this data to the user
            res.status(201).json({
                name: user.name,
                email: user.email,
                password: user.password,
                pic: user.pic,
                token: generateToken(user.id)
            })
        }
        else{
            res.status(400);
            throw new Error('Failed to creatre new user');
        }
    }
}))

//for logging in the users
app.post('/api/user/login',asyncHandler(async(req,res)=>{
    const {email, password} = req.body;
    const userExists = await User.findOne({email});
    if(userExists && (await userExists.matchPassword(password))){
        res.status(201).json({
            name: userExists.name,
            email: userExists.email,
            // password: userExists.password,
            pic: userExists.pic,
            token: generateToken(userExists.id)
        })
    }
    else{
            res.status(400);
            throw new Error('Invaild Credentials');
    }

}))
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`sever started at port ${PORT}`)
})