const mongoose = require('mongoose');

// Name / id of the sender
// email
// password
// picture
const userModel = mongoose.Schema({
    name:{
        type:String,
        required: true 
    },
    email:{type: String, required: true},
    password: {type: String, required: true},
    //type of picture is a string because when the user will be uploading
    //the pic then it will basically be a link
    pic :{type: String, 
        required: false, 
        default: 'https://www.dreamstime.com/default-avatar-profile-icon-vector-unknown-social-media-user-photo-default-avatar-profile-icon-vector-unknown-social-media-user-image184816085'}
},
{
    timestamps: true
});
const User = mongoose.Model("User", userModel);
module.exports = {User};