require("dotenv").config({ debug: process.env.DEBUG });
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const CashFlow = require("../models/userTransaction.js");
const userAmount = require("../models/userAmount.js");

exports.registration = (req, res) => {
  const fname = req.param("fname");
  const lname = req.param("lname");
  const email = req.param("email");
  const mobile = req.param("mobile");
  const password = req.param("password");
  const house = req.param("house");
  const role = req.param("role");

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

exports.allEmployeeData = async (req, res) => {
  try {
    const users = await User.find({});
    const results = await Promise.all(users.map(async (user) => {
      const latestTransaction = await CashFlow.find({ userId: user._id }).sort({ createdAt: -1 });
      const amount = await userAmount.findOne({ userId: user._id }); // Assuming you want to include user amount details
      return { user, latestTransaction, userAmount: amount };
    }));
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error retrieving employee data" });
  }
};

// Save data of edited user in the database

exports.updateEmpData = async (request, response) => {
  let user = await User.find({ email: request.params.email });
  console.log("user", user);
  console.log("request", request.body);
  user = request.body;

  // const empEditData = new User(user);
  try {
    await User.updateOne({ _id: request.params._id }, user);
    response.status(200).json({ msg: "Update Data Successfully" });
  } catch (error) {
    response.status(409).json({ msg: error.msg });
  }
};

exports.deleteUser = async (req, resp) => {
  console.log("ashish", req.params._id);
  try {
    await User.deleteOne({ _id: request.params._id });
    resp.status(200).json({ msg: "Employee deleted Successfully" });
  } catch (error) {
    resp.status(409).json({ msg: error.message });
  }
};

exports.  addcashflow = async (req, res) => {
  console.log("object");
  const { userId, ...rest } = req.body;
  try {
    const data = await CashFlow.create(req.body);
    res.status(200).json({ msg: "cash update Successfully", data });
  } catch (error) {
    res.status(409).json({ msg: error.message });
  }
};
exports.  addUserCashflow = async (req, res) => {
  console.log("object");
  const { userId, ...rest } = req.body;
  try {
    const data = await userAmount.create(req.body);
    res.status(200).json({ msg: "User cash update Successfully", data });
  } catch (error) {
    res.status(409).json({ msg: error.message });
  }
};



