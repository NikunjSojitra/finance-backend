require("dotenv").config({ debug: process.env.DEBUG });
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const CashFlow = require("../models/userTransaction.js");
const userAmount = require("../models/userAmount.js");
const mongoose = require("mongoose");

exports.registration = (req, res) => {
  const fname = req.param("fname");
  const lname = req.param("lname");
  const email = req.param("email");
  const mobile = req.param("mobile");
  const password = req.param("password");
  const house = req.param("house");
  const role = req.param("role");
  const adminId = req.param("adminId");

  if (!(fname && lname && password && mobile && email && role)) {
    res.json({ msg: "All fields are required" });
  }

  User.countDocuments({ email: email, password: password }, (err, c) => {
    if (c >= 1) {
      return res
        .status(200)
        .json({ msg: "Username or email address already exits" });
    } else {
      User.create(
        {
          fname,
          lname,
          email,
          mobile,
          password,
          house,
          role,
          adminId,
          // createdBy: req.user ? req.user._id : null,
        },
        (err, data) => {
          if (err) {
            console.log(err);
            return res.json({ msg: false });
          } else {
            return res.json({ data, msg: true });
          }
        }
      );
    }
  });
};

exports.login = (req, res) => {
  const email = req.param("email");
  const password = req.param("password");

  User.find({ email: email }, (err, user) => {
    if (err) {
      return res.status(200).json({ msg: "Error: Something happened" });
    }
    let data = JSON.parse(JSON.stringify(user));
    try {
      console.log(data[0].password);
    } catch (e) {
      return res.status(200).json({ msg: "User Doesn't Exits" });
    }
    if (data[0].password != password) {
      return res.status(200).send("Username or password incorrect");
    } else {
      const token = jwt.sign({ _id: data[0]._id }, process.env.SECRET_KEY);
      res.cookie("token", token, { expire: new Date() + 333 });

      return res.status(200).json({
        token,
        user: {
          _id: data[0]._id,
          fname: data[0].fname,
          lname: data[0].lname,
          email: data[0].email,
          mobile: data[0].mobile,
          house: data[0].house,
          role: data[0].role,
        },
      });
    }
  });
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
        const amount = await userAmount.findOne({ userId: user._id });
        return { user, latestTransaction, userAmount: amount };
      })
    );
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error retrieving employee data" });
  }
};

// Save data of edited user in the database

// exports.updateEmpData = async (req, res) => {
//   const userId = req.params._id;
//   const updateData = { ...req.body }; // clone request body to modify safely

//   // Remove userId from the update object to prevent overwriting
//   delete updateData.userId;

//   try {
//     console.log("Updating user with ID:", userId);
//     console.log("Update data (cleaned):", updateData);

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       updateData,
//       {
//         new: true,
//         runValidators: true
//       }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ msg: "User not found." });
//     }

//     return res.status(200).json({
//       msg: "User updated successfully.",
//       user: updatedUser
//     });
//   } catch (error) {
//     console.error("Error updating user:", error);
//     return res.status(500).json({ msg: error.message || "Internal Server Error" });
//   }
// };

exports.updateEmpData = async (req, res) => {
  const userId = req.params._id;
  const updateData = { ...req.body };

  // Extract userAmount-related fields and remove userId from main update
  const {
    credit,
    debit,
    interest,
    totalAmount,
    userId: relatedUserId,
  } = updateData;
  delete updateData.userId;

  try {
    // Step 1: Update User document
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      // new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    const updatedUserAmount = await userAmount.findOneAndUpdate(
      { userId: relatedUserId },
      { credit, debit, interest, totalAmount, userId: relatedUserId },
      { new: true, runValidators: true, upsert: true }
    );

    // if (!updatedUserAmount) {
    //   return res.status(404).json({ msg: "UserAmount not found for userId: " + relatedUserId });
    // }

    return res.status(200).json({
      msg: "User and UserAmount updated successfully.",
      user: updatedUser,
      userAmount: updatedUserAmount,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res
      .status(500)
      .json({ msg: error.message || "Internal Server Error" });
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


// exports.pendingUser = async (res, req) =>{
//   const userId =  req.params._id;

//   const todayDate = new Date();
// }