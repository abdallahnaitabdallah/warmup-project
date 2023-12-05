const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

// Your MongoDB connection string
const mongoURI = "mongodb+srv://anaitabdallah:Mongo5920@warmupnodejs.0ufzncn.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

async function insertDataFromCSV() {
  const db = client.db('seeds'); // Replace 'your_database_name' with your actual database name
  const collection = db.collection('email');

  const data = [];
  fs.createReadStream('emcail.csv')
    .pipe(csv())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', async () => {
      try {
        const result = await collection.insertMany(data);
        console.log(`${result.insertedCount} documents inserted into the collection`);
      } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
      } finally {
        await client.close();
      }
    });
}

async function main() {
  await connectToMongoDB();
  await insertDataFromCSV();
}

main();
