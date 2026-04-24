const mongoose = require("mongoose");

mongoose
  .connect("mongodb+srv://nikunjsojitra1416:f2D3Oygkx73ffBt3@cluster0.sjyjggw.mongodb.net/finance")
  .then(async () => {
    console.log("DB CONNECTED. Dropping index lname_1...");
    try {
      await mongoose.connection.collection("users").dropIndex("lname_1");
      console.log("Index dropped successfully.");
    } catch (e) {
      console.error("Error dropping index (maybe it doesn't exist?):", e.message);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.log("ERROR IN DB CONNECTION", error);
    process.exit(1);
  });
