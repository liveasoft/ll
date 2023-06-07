const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name : { type : String, required : [true, "Please enter your name"], trim: true },
    email : { type : String, required : [true, "Please enter your email"], trim: true, unique: true },
    password : { type : String, required : [true, "Please enter your password"], trim: true },
    status : { type : Number, default : 0 },
    avatar : { type : String, default : "https://www.kindpng.com/picc/m/24-248729_stockvader-predicted-adig-user-profile-image-png-transparent.png" },
},{
    timestamps : true
})

module.exports = mongoose.model("Users", userSchema)