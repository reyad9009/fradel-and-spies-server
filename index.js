const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jx9i0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    //console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // all food related apis
    const foodCollection = client.db('restaurant').collection('foods');
    const foodPurchase = client.db('restaurant').collection('Purchase');

    // post data
    app.post('/food', async (req, res) => {
      const newFood = req.body;
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    })

    // get all data
    app.get('/foods', async (req, res) => {
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get food details by ID
    app.get('/foods/details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    // Get food details by ID
    app.get('/foods/details/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    // Handle food purchase
    app.post("/foods/purchase", async (req, res) => {
      const newFood = req.body;
      const result = await foodPurchase.insertOne(newFood);
      res.send(result);
    });

    // Get total purchased quantity of a specific food
    app.get('/foods/purchase/:foodId', async (req, res) => {
      const foodId = req.params.foodId;

      const result = await foodPurchase.aggregate([
        { $match: { foodId: foodId } },
        {
          $group: {
            _id: "$foodId",
            totalQuantity: { $sum: "$quantity" },
          }
        },
      ]).toArray();
      res.send(result[0] || { totalQuantity: 0 });

    });

    // Update food quantity
    app.patch("/food/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedQuantity = req.body;
      const update = { $set: { quantity: updatedQuantity.quantity } };
      const result = await foodCollection.updateOne(filter, update);
      res.send(result);
    });

    // Get logged-in user's foods
    app.get('/my-foods/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await foodCollection.find(filter).toArray();
      res.send(result)
    });

    // Update user's food
    app.get('/my-foods/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    // update foods by logged-in user only her foods
    app.put('/my-foods/update/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedFood = req.body;
      const equipment = {
        $set: {
          foodName: updatedFood.foodName,
          image: updatedFood.image,
          category: updatedFood.category,
          quantity: updatedFood.quantity,
          price: updatedFood.price,
          foodOrigin: updatedFood.foodOrigin,
          description: updatedFood.description,
          email: updatedFood.email,
          name: updatedFood.name,
        },
      };
      const result = await foodCollection.updateOne(filter, equipment, options);
      res.send(result);
    });

    // Get logged-in user's orders
    app.get('/my-orders/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await foodPurchase.find(filter).toArray();
      res.send(result)
    });

    // Delete user's order
    app.delete('/my-orders/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodPurchase.deleteOne(query);
      res.send(result);
    })

    // Get top-selling foods
    app.get('/home-foods', async (req, res) => {
      try {
        const result = await foodPurchase.aggregate([
          // Group by foodId to calculate the total quantity sold for each food item
          {
            $group: {
              _id: "$foodId", // Group by foodId
              foodName: { $first: "$foodName" }, // Get the food name
              price: { $first: "$price" },
              totalQuantity: { $sum: "$quantity" },
              image: { $first: "$image" }, // Get the image
              foodOrigin: { $first: "$foodOrigin" },
            }
          },
          // Sort by totalQuantity in descending order
          { $sort: { totalQuantity: -1 } },
          // Limit to top 6 items
          { $limit: 6 }
        ]).toArray();

        res.send(result);
      } catch (error) {
        //console.error("Error fetching top-selling foods:", error);
        res.status(500).send({ error: "Failed to fetch data" });
      }
    });


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('food is falling from the sky')
})

app.listen(port, () => {
  console.log(`food is waiting at: ${port}`)
})


