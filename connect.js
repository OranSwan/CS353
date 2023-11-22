//home install npm and nodejs

const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = "mongodb+srv://Group10DB:WeAreGroupTen10@group10cluster.df8uelv.mongodb.net/";

const client = new MongoClient(uri);

async function run() {
  try {
    const database = client.db('MoviesRating');
    const movies = database.collection('movies');

    const query = { title: 'Spiderman' };
    const movie = await movies.findOne(query);

    console.log(movie);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);