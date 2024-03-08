import path from 'path';
import redisClient from '../utils/redis';
import mongodbClient from '../utils/db';

const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');

class FilesController {
  static async postUpload(req, res) {
    try {
      const userToken = req.header('x-token');
      const userId = await redisClient.get(`auth_${userToken}`);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      const {
        name, type, parentId, data, isPublic,
      } = await req.body;

      if (!name) {
        return res.status(400).send({ error: 'Missing name' });
      }
      if (!type) {
        return res.status(400).send({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).send({ error: 'Missing data' });
      }
      if (parentId) {
        const file = await mongodbClient.db
          .collection('files')
          .findOne({ _id: ObjectId(parentId.toString()) });
        if (!file) {
          return res.status(400).send({ error: 'Parent not found' });
        }
        if (file.type !== 'folder') {
          return res.status(400).send({ error: 'Parent is not a folder' });
        }
      }
      const obj = {
        userId, name, type, isPublic: isPublic || false, parentId: parentId || 0,
      };
      if (type === 'folder') {
        const folder = await mongodbClient.db
          .collection('files').insertOne({
            ...obj,
          });
        return res.status(201).json({
          id: folder.insertedId, ...obj,
        });
      }
      const relativePath = process.env.FOLDER_PATH || '/tmp/files_manager';

      const fileName = uuidv4();
      const filePath = path.join(relativePath, fileName);

      // create folder in case if is not existe
      await fs.mkdir(filePath, { recursive: true });
      const content = type === 'file' ? Buffer.from(data, 'base64').toString(
        'utf-8',
      ) : Buffer.from(data, 'base64');

      // save file in local machine
      await fs.writeFile(`${filePath}/${name}`, content);

      // save the data in the database

      const file = await mongodbClient.db
        .collection('files').insertOne({ ...obj, localPath: filePath });

      return res.status(201).json({
        id: file.insertedId, ...obj,
      });
    } catch (error) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  }
}

module.exports = FilesController;
