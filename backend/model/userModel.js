const mongoose = require('mongoose');

//bycrypt is the library is the one that helps to hash passwords
const bcrypt = require('bcryptjs');

// Name / id of the sender
// email
// password
// picture
const userModel = mongoose.Schema({
    name:{
        type:String,
        required: true 
    },
    email:{type: String, required: true, unique: true},
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

//to generate the function to compare the password for logging in
userModel.methods.matchPassword = async function(enteredPassword){

    //returning it is important
    return await bcrypt.compare(enteredPassword, this.password);
}


//before saving the information, we are going to encrypt the password in the database

//before saving, what it should do... thats why we used pre
//next because its going to be a middleware
userModel.pre("save", async function(next) //next because its a middleware
    //if the current password is not modified, then moveon to the next
    //means dont run the code after it
    {if(!this.isModified){
    next(); //means do not run the code after it
}

//else we will generate the new password
//through bcrypt documentation
    //bcrypt is used for the encryption purpose
    //bcrypt has been installed using npm
    //higher the number, the more stronger salt will be generated   
    const salt = await bcrypt.genSalt(10);

    //creating the has of the password with the salt
    this.password = await bcrypt.hash(this.password, salt);

})
const User = mongoose.model("User", userModel);
module.exports = User;