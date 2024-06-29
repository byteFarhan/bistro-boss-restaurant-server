const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const prot = process.env.PORT || 5000;

//middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

const verifyToken = (req, res, next) => {
  // console.log("line 20", req?.headers.authorization);
  const token = req?.headers?.authorization.split(" ")[1];
  // console.log(token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  // const token = req?.headers?.authorization.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;

    next();
  });
};

const verifyUser = async (req, res, next) => {
  const email = req.params?.email;
  if (email !== req?.decoded?.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};
const verifyAdmin = async (req, res, next) => {
  // const email = req.params?.email;
  // console.log("email", email);
  // console.log("decoded", req?.decoded?.email);
  // if (email !== req?.decoded?.email) {
  //   return res.status(403).send({ message: "forbidden access" });
  // }

  const email = req?.decoded?.email;
  const query = { email: email };
  const user = await users_collection.findOne(query);
  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bistro-boss-cluster.lkmirp3.mongodb.net/?retryWrites=true&w=majority&appName=BISTRO-BOSS-Cluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// DB Collections
const users_collection = client.db("BISTRO-BOSS").collection("users");
const menus_collection = client.db("BISTRO-BOSS").collection("menus");
const reviews_collection = client.db("BISTRO-BOSS").collection("reviews");
const cart_collection = client.db("BISTRO-BOSS").collection("cart");
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Jwt related api's
    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      // console.log(token);
      res.send({ token });
    });

    // Users collecton
    // POST :: add an new user to the users collection in database
    app.post("/users", async (req, res) => {
      const user = req.body;
      let query = { email: user?.email };
      const isUserExist = await users_collection.findOne(query);
      if (isUserExist) {
        return res.send({ message: "user already exists!", insertedId: null });
      }
      const result = await users_collection.insertOne(user);
      res.send(result);
    });

    // GET :: get users from users collection in database
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      // console.log("test", req.headers);
      const result = await users_collection.find().toArray();
      res.send(result);
    });

    // DELETE :: delete user from users collection in database
    app.delete("/users/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await users_collection.deleteOne(query);
      res.send(result);
    });
    // PATCH :: update user info from users collection in database
    app.patch("/user/admin/:id", async (req, res) => {
      // const userInfo = req.body;
      const filter = { _id: new ObjectId(req.params.id) };
      // console.log(filter);
      const updatedInfo = {
        $set: {
          role: "admin",
        },
      };
      const result = await users_collection.updateOne(filter, updatedInfo);
      res.send(result);
    });

    // GET :: chack is the user admin or not from users collection in database
    app.get("/user/admin/:email", verifyToken, verifyUser, async (req, res) => {
      const email = req?.params?.email;
      // console.log("email", email);
      // console.log("decoded", req?.decoded?.email);
      // if (email !== req?.decoded?.email) {
      //   return res.status(403).send({ message: "forbidden accesss" });
      // }
      const query = { email: email };
      let isAdmin = false;
      // const result = await users_collection.findOne(query);
      // console.log(result?.role);
      // if (result?.role === "admin") {
      //   isAdmin = true;
      // }
      const user = await users_collection.findOne(query);
      // console.log("user", user);
      if (user) {
        isAdmin = user?.role === "admin";
      }
      // console.log(isAdmin);
      res.send({ isAdmin });
    });

    // GET :: get menus from menus collection in database
    app.get("/menus", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = { category: req.query.category };
        // console.log(req.query.category);
      }

      const result = await menus_collection.find(query).limit(6).toArray();
      res.send(result);
    });
    // GET :: get popular menus from menus collection in database
    app.get("/popular-menus", async (req, res) => {
      const query = { category: "popular" };
      const result = await menus_collection.find(query).limit(6).toArray();
      res.send(result);
    });

    // GET :: get all reviews from reviews collection in database
    app.get("/reviews", async (req, res) => {
      const result = await reviews_collection.find().toArray();
      res.send(result);
    });

    // cart collection
    // POST :: add an new cart item to the cart collection in database
    app.post("/cart", async (req, res) => {
      const newItem = req.body;
      // console.log(newItem);
      const result = await cart_collection.insertOne(newItem);
      res.send(result);
    });
    // GET :: get cart items from the cart collection in database
    app.get("/cart", async (req, res) => {
      const query = { email: req?.query?.email };
      const result = await cart_collection.find(query).toArray();
      res.send(result);
    });
    // DELETE :: delete cart item from the cart collection in database
    app.delete("/cart/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await cart_collection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
``;

app.get("/", (req, res) => {
  res.send("The Bistro Boss server is running...");
});

app.listen(prot, () => {
  console.log(`The Bistro Boss server running on port ${prot}`);
});
