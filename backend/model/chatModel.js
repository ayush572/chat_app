const mongoose = require('mongoose');

// chatName
// isGroupchat
// list of users
// latestMessage
// groupAdmin (in case if its a group chat)

//inside the mongoose schema, we are going to define our object
const chatModel = new mongoose.Schema(
    {
        //trim: true means that there are no trailing spaces before or
        //after the name
        chatName:{type:String, trim:true},
        isGroupChat: {type: Boolean, default: false},
        //users will be array of objects
        //single chat - 2 users
        //group chat - >=2 users
        users:[{
            //this will contain the id to that particular user
            //which is being referenced fron the User model
            type:mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        //to display the latest message upfront
        latestMessage:{
            type:mongoose.Schema.Types.ObjectId,
            //it is going to be referring the the particular part of the 
            //database where the message is being stored
            ref:"Message"
        },
        groupAdmin:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Users'
        }
    },
    {
        //if a new chat is added, then the timestamp to that will be
        //shown
        timestamps: true
    }
);
const Chat = mongoose.model("Chat",chatModel);

module.exports = Chat; 


