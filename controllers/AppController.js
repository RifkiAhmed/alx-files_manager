import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    const redisIsAlive = await redisClient.isAlive();
    const dbIsAlive = await dbClient.isAlive();

    return res.status(200).send({ redis: redisIsAlive, db: dbIsAlive });
  }

  static async getStats(req, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();

    return res.status(200).send({ users: usersCount, files: filesCount });
  }
}

module.exports = AppController;
