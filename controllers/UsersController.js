import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');
const { ObjectId } = require('mongodb');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    const user = await dbClient.db.collection('users').findOne({ email });
    if (user) {
      return res.status(400).send({ error: 'Already exist' });
    }
    const hashedPassword = sha1(password);
    const id = await dbClient.db
      .collection('users')
      .insertOne({ email, password: hashedPassword });
    return res.status(201).send({ id, email });
  }

  static async getMe(req, res) {
    const userToken = req.header('x-token');
    const userId = await redisClient.get(`auth_${userToken}`);
    if (userId) {
      const user = await dbClient.db
        .collection('users')
        .findOne({ _id: ObjectId(userId.toString()) });
      return res.status(200).send({ id: user._id, email: user.email });
    }
    return res.status(401).send({ error: 'Unauthorized' });
  }
}

module.exports = UsersController;
