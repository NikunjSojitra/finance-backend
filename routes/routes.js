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
  adminId,
  getUsers,
  updateUserRole,
  createUserByFinancer
} = require("../api/controllers/controllers.js");
const { verifyToken, verifySuperAdmin, verifyFinancier } = require("../middlewares/auth.js");

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

// New Role-based Routes
router.get("/users", verifyToken, getUsers);
router.put("/users/:id/role", verifySuperAdmin, updateUserRole);
router.post("/users", verifyFinancier, createUserByFinancer);

module.exports = router;
