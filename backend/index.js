const express = require('express');
const { chatarea } = require('./data');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

const jwt = require('jsonwebtoken');
const {notFound} = require('./middleware/errorMiddleware')
//this package will automatically handle the async errors for us
const asyncHandler = require('express-async-handler');
const { protect } = require('./middleware/authMiddleware');
const Chat = require('./model/chatModel');
const User = require('./model/userModel');
dotenv.config();
connectDB();
const app = express();

//as we are sending the data from the frontend, hence in order to accept the json data from frontend
//we have to specify the same  
app.use(express.json());

function generateToken(id){
    //signing or creating a new token with a particular unique id 
    //this is the syntax for the same
    return jwt.sign({id},process.env.JWT_SECRET,{
        //in how much time does this token expires
        //this is done because as these are the credentials, we shouldn't
        //keep the token longer than required
        expiresIn: "30d" //30 days
    });
}
//http requests

//for registering the users
//this package - asynchandler, will automatically handle the async errors for us
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

//here we are trying to send the data to the backend
//method 1 : either use the POST request and send it via body
//method 2 : using queries example) /api/user?search=ayush
// app.use(protect);
app.get('/api/user',protect,asyncHandler(async(req,res)=>{

    //checking that if there is any query inside of it, i.e inside of the api
    const keyword = req.query.search?{ //to take the query from the api - req.query.name_of_the_query
        //then we are going to search the use through their email and name
        $or : [{
            //we are searching inside their name
            

            //format - { <field>: { $regex: /pattern/, $options: '<options>' } }
            // { <field>: { $regex: 'pattern', $options: '<options>' } }
            // { <field>: { $regex: /pattern/<options> } }
            name : {$regex: req.query.search, $options: "i"} //options === i means that upper and lower case to be treated equally, i.e case Insensitive
        },{
            email : {$regex: req.query.search, $options: "i"}
        }]

    }:{}; //else we are not gonna do anything

    //we want all the search results but expect for the user who is currently logged in.
    //$ne -> means not equal, hence except the current users, return to me all the users who are the part of the result
    const users = await User.find(keyword).find({id:{$ne: req.user.id}}); //this last part makes sure that we are finding the
    //this above line is the query of mongodb - User.find                 users who are all except the current logged in user
    res.send(users);
}))

//for logging in the users
//it will be running the protect middleware before running anything

app.post('/api/user/login',asyncHandler(async(req,res)=>{
    const {email, password} = req.body;
    console.log(email);
    console.log(password);
    const userExists = await User.findOne({email});
    console.log(userExists);
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

//CHATS ROUTES

//1)For accessing the chat (only one on one chat)
app.post('/api/chat',protect,asyncHandler(async(req,res)=>{
    //if a chat with the userId exists, then we will return the same, otherwise will create a new one
    const {userId} = req.body;
    if(!userId)
    {
        console.log('userid param not sent with the request');
        res.sendStatus(400);
    }
    //otherwise, if the userId has been sent in the body, then we want to fetch the one on one chat
    var isChat = await Chat.find({
        isGroupChat: false,

        //for isChat to exist, it is necessary that both of the and condition satisfies
        $and:[
            //users is the users array in the chat model
            //we want to find the current user who is logged in and the userId that we are provided with
            {users:{$elemMatch:{$eq:req.user.id} }}, //current user logged in
            {users:{$elemMatch:{$eq:req.userId} }}, //equal to userId that we got from the body
        ]
        //-password -> means except password, we are going to populate the isChat wih all the user info from userModel.js
    }).populate("users","-password")
    .populate("latestMessage") //we are also populating the latestmessage from messageModel.js


    //Now it will have all the file data inside of our chat, i.e isChat
    //Also, inside of the messageModel.js, we have the sender field which we would again want to populate
    isChat = await User.populate(isChat,{ //populate the user inside the latest message 

        //what we are looking to populate, i.e the path, or the sender inside the latestMessage
        path: 'latestMessage.sender', 
        select: 'name pic email' //what we are looking forward to populate inside it
    })
    
    //if chat already exists, then we will just send the chat
    if(isChat.length>0){
        res.send(isChat[0]); //means, no other chat can exist within the above two users
    }
    else{
        //otherwise, we will create the new chat between them
        var chatData = {
            chatName : "sender",
            isGroupChat: false,
            users: [req.user._id,userId] //means who are the users who will be chatting 
        }

        //now will will store it into our database
        try{
            const createdChat = await Chat.create(chatData);

            //now we are taking the chat that has been created above and then sending it to the user
            const fullChat = await Chat.findOne({_id: createdChat._id}).populate("users","-password") //finding the chat with the id of 
                                                                                                //created chat, and finally populating the users array  
            res.status(200).send(fullChat);
        }
        catch (err){
            res.status(400);
            throw new Error(err.message);
        }
    }
}));

//2)to fetch the data from the db for a particular user for all his chats
app.get('/api/chat',protect,asyncHandler(async(req,res)=>{

    //only thing we need to do is that, we have to check that which user is logged in and query for that chat
    try {
        //we are going to search through all of the chats in our database
        //and see that the user that is currently logged in is the part
        //of which all chats??
        Chat.find({users:{$elemMatch:{$eq:req.user._id}}})
        .populate("users","-password")   //populate will basically combine all the data at the ref , which is the another collection
                                        //that has been defined in the database
        .populate("groupAdmin","-password")
        .populate("latestMessage")
        .sort({updatedAt: -1})           //sorting from the latest to oldest chats
        .then(async(results)=>{
            results = await User.populate(results,{
                path: 'latestMessage.sender', //as sender is inside the messageModel.js which again has to be populated 
                                              //because its ref is User model
                select: "name pic email"
            })
        res.status(200).send(results); //finally returning to user
        })
    } catch (error) {
        res.status(400);
            throw new Error(err.message);
    }
}))

//3)For the creation of a group chat
app.post('/api/chat/group',protect, asyncHandler(async(req,res)=>{
    //we are going to take a bunch of users from the body and name of the group chat
    if(!req.body.users && !req.body.name){
        return res.status(400).send({message: "Please fill all the fields"})
    }
    else{
        //we are going to take all of the users from the body
        var users = JSON.parse(req.body.users); //as we r sending an array from frontend so we have to send it in the 
                                                //stringify format which we r then parsing here
        //checking if the no of users for a group chat is >2 or not
        if(users.length<2)
        {
            res.status(400).send("more then 1 user is required to form a group chat")
        }
        //so all of the users + the currently logged in user will be the part of group chat
        users.push(req.user);
        try {
            //query to database 
            const groupChat = await Chat.create({
                chatName: req.body.name,
                users: users,
                isGroupChat: true,
                groupAdmin: req.user
            });

            //after this creation of the groupChat, we r going to fetch the same from our database
            //and send it back to the user
            const fullGroupChat =  await Chat.findOne({_id: groupChat._id})
                                    .populate("users","-password")
                                    .populate("groupAdmin","-password");
            res.status(200).json(fullGroupChat);
        } catch (err) {
            res.status(400);
            throw new Error(err.message);
        }
    }
}))

//4)For the renaming the group
app.put('/api/chat/rename',protect,asyncHandler(async(req,res)=>{
    //just gonna take the chat id which we r looking to rename
    const {chatId,chatName} = req.body;
    const uploadedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName    
        },
        {
            new: true //means to return the new name to the group
        }
    ).populate("users","-password")
    .populate("groupAdmin","=password")

    if(!updatedChat){
        res.status(404);
        throw new error("chat not found")
    }
    else{
        res.json(updatedChat);
    }
}

));

//5)For the removing some from the group
app.put('/api/chat/remove',protect,asyncHandler(async(req,res)=>{
    //whats the chat ID and the user that needs to be added to the chat
    const {chatId, userId} = req.body;
    const removed = await Chat.findByIdAndUpdate(chatId,{
        //upadting the users array or pushing inside of it, the particular userId we are suppposed to push
        $pull:{users: userId},
    },
    {
        new: true //to return the latest field
    }).populate("users","-password")
    .populate("groupAdmin","-password")
    if(!added){
        res.status(404);
        throw new error("chat not found")
    }
    else{
        res.json(removed);
    }
}
));

//4)For adding someone into the group
app.put('/api/chat/add',protect,asyncHandler(async(req,res)=>{
    //whats the chat ID and the user that needs to be added to the chat
    const {chatId, userId} = req.body;
    const added = await Chat.findByIdAndUpdate(chatId,{
        //upadting the users array or pushing inside of it, the particular userId we are suppposed to push
        $push:{users: userId},
    },
    {
        new: true //to return the latest field
    }).populate("users","-password")
    .populate("groupAdmin","-password")
    if(!added){
        res.status(404);
        throw new error("chat not found")
    }
    else{
        res.json(added);
    }
}));


//these are the custom middlewares that are use to handle the error.
//notFound throws the error if none of the above paths matches the given path
//is invalid
app.use(notFound);
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`sever started at port ${PORT}`)
})