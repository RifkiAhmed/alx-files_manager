import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const localhost = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
    const port = process.env.DB_PORT ? process.env.DB_PORT : 27017;
    const dataBase = process.env.DB_DATABASE
      ? process.env.DB_DATABASE
      : 'files_manager';
    const url = `mongodb://${localhost}:${port}`;

    this.client = new MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    this.client
      .connect()
      .then(() => {
        console.log('Connected successfully to server');
        this.db = this.client.db(dataBase);
      })
      .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
        throw err;
      });
  }

  isAlive() {
    return this.client.topology.isConnected();
  }

  async nbUsers() {
    const users = await this.db.collection('users').countDocuments();
    console.log(users);
    return users;
  }

  async nbFiles() {
    const files = await this.db.collection('files').countDocuments();
    console.log(files);
    return files;
  }
}
const dbClient = new DBClient();
export default dbClient;
