const express = require("express");

let {
  registration,
  login,
  allEmployeeData,
  deleteUser,
  updateEmpData,
  addcashflow,
} = require("../controllers/controllers.js");

let router = express.Router();

router.post("/signup", registration);
router.post("/login", login);
router.get("/allEmployeeData", allEmployeeData);
router.delete("/deleteEmployee/:id", deleteUser);
router.patch("/updateEmpData/:id", updateEmpData);
router.post("/updateEmpData/cash", addcashflow);

module.exports = router;
