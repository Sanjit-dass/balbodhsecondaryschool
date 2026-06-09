const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://sanjit9842_db_user:S%40njit%40123@cluster0.z2ri0sb.mongodb.net/balbodh_school?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("✅ CONNECTED TO MONGODB");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ CONNECTION FAILED");
    console.error(err);
    process.exit(1);
  });
  