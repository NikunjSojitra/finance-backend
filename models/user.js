const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    trim: true,
    required: "First Name is required",
  },
  lname:{
    type:String,
    trim:true,
    required:"Last Name is required",
    unique:true 
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: "Email address is required",
  },
  password: {
    type: String,
    required: "password is required",
  },
  mobile: {
    type: String,
    required: "number is required",
  },
  house: {
    type: String,
    required: "house number is required",
  },
  role: {
    type: String
  },
  adminId: {
    type: String,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

},{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model("User", userSchema);
