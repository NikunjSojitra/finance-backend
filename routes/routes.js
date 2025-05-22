const express = require("express");

let {
  registration,
  login,
  allEmployeeData,
  deleteUser,
  updateEmpData,
  addcashflow,
  addUserCashflow,
  deleteTransaction,
  adminId
  
} = require("../controllers/controllers.js");
const { verifyAdmin } = require("../middlewares/auth");

let router = express.Router();

router.post("/signup", registration);
router.post("/login", login);
router.get("/allEmployeeData", allEmployeeData);
router.get("/adminid", adminId);
router.delete("/deleteEmployee/:id", deleteUser);
router.patch("/updateEmpData/:_id", updateEmpData);
router.post("/updateEmpData/cash", addcashflow);
router.post("/updateEmpData/usercash", addUserCashflow);
router.delete("/deletetransaction/:id", deleteTransaction);

module.exports = router;
