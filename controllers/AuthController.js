import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8',
    );
    const [email, password] = credentials.split(':');
    const user = await dbClient.db
      .collection('users')
      .findOne({ email, password: sha1(password) });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    redisClient.set(`auth_${token}`, user._id.toString(), 24 * 3600);
    res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const userToken = req.header('x-token');
    const userId = await redisClient.get(`auth_${userToken}`);
    if (userId) {
      await redisClient.del(`auth_${userToken}`);
      return res.status(204).send();
    }
    return res.status(401).send({ error: 'Unauthorized' });
  }
}

module.exports = AuthController;
