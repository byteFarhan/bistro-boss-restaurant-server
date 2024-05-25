const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const prot = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("The Bistro Boss server is running...");
});

app.listen(prot, () => {
  console.log(`The Bistro Boss server running on port ${prot}`);
});
