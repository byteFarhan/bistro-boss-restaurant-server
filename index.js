const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const prot = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

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
    app.get("/users", async (req, res) => {
      const result = await users_collection.find().toArray();
      res.send(result);
    });
    // DELETE :: delete user from users collection in database
    app.delete("/users/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await users_collection.deleteOne(query);
      res.send(result);
    });
    // PATCH :: patch user info from users collection in database
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
