const mongoose = require('mongoose');

// Name / id of the sender
// content of the message
// reference to the chat to which it belongs to
const messageModel = mongoose.Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content:{type: String, trim: true},
    chat: {type: mongoose.Schema.Types.ObjectId, ref: "Chat"}
},
{
    timestamps: true
});
const Message = mongoose.Model("Message", messageModel);
module.exports = Message;