require("dotenv").config({ debug: process.env.DEBUG });
const jwt = require("jsonwebtoken");
const User = require("../../models/user.js");
const CashFlow = require("../../models/userTransaction.js");
const userAmount = require("../../models/userAmount.js");
const mongoose = require("mongoose");

exports.registration = async (req, res) => {
  try {
    const { fname, lname, email, mobile, password, house, role, adminId } = req.body;

    if (!fname || !lname || !password || !mobile || !email) {
      return res.json({ msg: "All fields are required" });
    }

    const assignedRole = role || "user";

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.json({ msg: "Email address already exists" });
    }

    const newUser = await User.create({
      fname,
      lname,
      email: email.toLowerCase(),
      mobile,
      password, // Password will be hashed by the pre-save hook in the User model
      house,
      role: assignedRole,
      adminId,
    });

    return res.json({ data: newUser, msg: true });
  } catch (err) {
    console.error("Registration error:", err);
    return res.json({ msg: err.message || "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(200).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ msg: "User Doesn't Exits" });
    }

    // Check if the plain text password matches the hashed password
    const isMatch = await user.comparePassword(password);
    
    // Fallback: If for some reason the db has a plain text password (from older records)
    const isPlainTextMatch = user.password === password;

    if (!isMatch && !isPlainTextMatch) {
      return res.status(200).json({ msg: "Username or password incorrect" }); // Send JSON instead of plain string to match frontend expectations
    }

    if (user.role === 'user') {
      return res.status(403).json({ msg: "Access denied" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY);
    res.cookie("token", token, { expire: new Date() + 333 });

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        mobile: user.mobile,
        house: user.house,
        role: user.role,
      },
      msg: true // Ensure msg: true is sent on success for frontend compatibility if needed
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ msg: "Error: Something happened" });
  }
};

exports.adminId = (req, res) => {
  User.find({}, "adminId email  ", (err, users) => {
    if (err) {
      return res.status(500).json({ msg: "Error: Something happened" });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }
    const result = users.map((user) => ({
      adminId: user.adminId,
      email: user.email,
    }));

    return res.status(200).json({ result });
  });
};

exports.allEmployeeData = async (req, res) => {
  try {
    const users = await User.find({});
    const results = await Promise.all(
      users.map(async (user) => {
        const latestTransaction = await CashFlow.find({
          userId: user._id,
        }).sort({ createdAt: -1 });
        const amount = await userAmount.findOne({ userId: user._id }).sort({ createdAt: -1 });
        return { user, latestTransaction, userAmount: amount };
      })
    );
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error retrieving employee data" });
  }
};

exports.updateEmpData = async (req, res) => {
  const { fname, lname, email, mobile, credit, debit, interest, totalAmount, images } = req.body;
  const userId = req.params._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fname, lname, email, mobile, images },
      { new: true, runValidators: true, session }
    );

    const updatedFlow = await userAmount.findOneAndUpdate(
      { userId: userId },
      { credit, debit, interest, totalAmount },
      { new: true, upsert: true, session, sort: { createdAt: -1 } }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ msg: "Update Data Successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: "Update failed", error });
  }
};



exports.deleteUser = async (req, resp) => {
  console.log("Deleting user with ID:", req.params.id);

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return resp.status(400).json({ msg: "Invalid user ID format." });
    }

    const result = await User.deleteOne({ _id: req.params.id });
    console.log("Delete result:", result);

    if (result.deletedCount > 0) {
      resp.status(200).json({ msg: "Employee deleted successfully" });
    } else {
      resp.status(404).json({ msg: "Employee not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    resp.status(500).json({ msg: error.message });
  }
};

exports.addcashflow = async (req, res) => {
  console.log("object");
  const { userId, date, ...rest } = req.body;
  try {
    const data = await CashFlow.create(req.body);
    res.status(200).json({ msg: "cash update Successfully", data });
  } catch (error) {
    res.status(409).json({ msg: error.message });
  }
};

exports.deleteTransaction = async (req, resp) => {
  console.log("Deleting transaction with ID:", req.params.id);

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return resp.status(400).json({ msg: "Invalid transaction ID format." });
    }

    const result = await CashFlow.deleteOne({ _id: req.params.id });
    console.log("Delete result:", result);

    if (result.deletedCount > 0) {
      return resp.status(200).json({ msg: "Transaction deleted successfully" });
    } else {
      return resp.status(404).json({ msg: "Transaction not found" });
    }
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return resp
      .status(500)
      .json({ msg: "Internal server error. Please try again later." });
  }
};

exports.addUserCashflow = async (req, res) => {
  console.log("object");
  const { userId, ...rest } = req.body;
  try {
    const data = await userAmount.create(req.body);
    res.status(200).json({ msg: "User cash update Successfully", data });
  } catch (error) {
    res.status(409).json({ msg: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'financer') {
      query.createdBy = req.user._id;
    }
    const users = await User.find(query).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching users", error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    if (!['superadmin', 'financer', 'user'].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json({ msg: "User role updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ msg: "Error updating role", error: error.message });
  }
};

exports.createUserByFinancer = async (req, res) => {
  try {
    const { fname, lname, email, mobile, password, house } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }
    
    const newUser = await User.create({
      fname,
      lname,
      email,
      mobile,
      password,
      house,
      role: 'user',
      createdBy: req.user._id
    });
    
    res.status(201).json({ msg: "User created successfully", user: { _id: newUser._id, email: newUser.email, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ msg: "Error creating user", error: error.message });
  }
};
