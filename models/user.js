const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    trim: true,
    required: "First Name is required",
  },
  lname: {
    type: String,
    trim: true,
    required: "Last Name is required",
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
  },
  role: {
    type: String,
    enum: ['superadmin', 'financer', 'user'],
    default: 'user'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: null 
  },
  images: {
    type: [String],
    default: []
  },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);