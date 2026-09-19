const path = require("path");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
}

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 10000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Air Quality API running on port ${PORT}`);
  });
})();
