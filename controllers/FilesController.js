import path from 'path';
import redisClient from '../utils/redis';
import mongodbClient from '../utils/db';
import fileQueue from '../worker';

const fs = require('fs').promises;
const mime = require('mime-types');
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
        name,
        type,
        parentId,
        data,
        isPublic,
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
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
      };
      if (type === 'folder') {
        const folder = await mongodbClient.db.collection('files').insertOne({
          ...obj,
        });
        return res.status(201).send({
          id: folder.insertedId,
          ...obj,
        });
      }
      const relativePath = process.env.FOLDER_PATH || '/tmp/files_manager';

      const fileName = uuidv4();
      const filePath = path.join(relativePath, fileName);

      // create folder in case if is not existe
      await fs.mkdir(relativePath, { recursive: true });
      const content = type === 'file'
        ? Buffer.from(data, 'base64').toString('utf-8')
        : Buffer.from(data, 'base64');

      // save file in local machine
      await fs.writeFile(`${filePath}`, content);

      // save the data in the database

      const file = await mongodbClient.db
        .collection('files')
        .insertOne({ ...obj, localPath: filePath });

      if (obj.type === 'image') {
        fileQueue.add({
          fileId: file.insertedId,
          userId,
        });

        // fileQueue.on('failed', (failedJob, err) => {
        //   if (failedJob.id === job.id) {
        //     return res.status(500).send({ error: err.message });
        //   }
        //   return null;
        // });
      }

      return res.status(201).send({
        id: file.insertedId,
        ...obj,
      });
    } catch (error) {
      return res.status(500).send({ Error: error.message });
    }
  }

  static async getShow(req, res) {
    const { id: fileId } = req.params;
    const userToken = req.header('x-token');
    const user = await redisClient.get(`auth_${userToken}`);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const file = await mongodbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(fileId.toString()) });

    if (!file || file.userId !== user) {
      return res.status(404).send({ error: 'Not found' });
    }

    const {
      _id: id,
      userId,
      name,
      type,
      parentId,
      isPublic,
    } = file;

    return res.status(200).send({
      id,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getIndex(req, res) {
    try {
      const userToken = req.header('x-token');
      const userId = await redisClient.get(`auth_${userToken}`);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      const { parentId, page } = await req.query;
      const parentId_ = (await parentId) !== undefined ? parentId : null;
      const skip = (await page) !== undefined ? Number(page) * 20 : 0;

      let pipline = [
        { $skip: skip },
        { $limit: 20 },
        {
          $project: {
            id: '$_id',
            userId: '$userId',
            name: '$name',
            type: '$type',
            isPublic: '$isPublic',
            parentId: '$parentId',
            _id: 0,
          },
        },
      ];

      if (parentId_ !== null) {
        pipline = [
          { $match: { parentId: parentId_ === '0' ? 0 : parentId_ } },
          ...pipline,
        ];
      }
      const files = await mongodbClient.db
        .collection('files')
        .aggregate(pipline)
        .toArray();
      return res.status(200).send(files);
    } catch (error) {
      return res.status(500).send('');
    }
  }

  static async putPublish(req, res) {
    try {
      const userToken = await req.header('x-token');
      const idUser = await redisClient.get(`auth_${userToken}`);
      console.log(idUser);
      if (!idUser) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      const userInDb = await mongodbClient.db
        .collection('users')
        .findOne({ _id: ObjectId(idUser.toString()) });

      if (!userInDb) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { id: fileId } = await req.params;

      const file = await mongodbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(fileId.toString()) });

      if (!file || file.userId !== idUser) {
        return res.status(404).send({ error: 'Not found' });
      }
      const {
        _id: id,
        userId,
        name,
        type,
        parentId,
      } = file;

      await mongodbClient.db
        .collection('files')
        .updateOne(
          { _id: ObjectId(fileId.toString()) },
          { $set: { isPublic: true } },
        );

      return res.status(200).send({
        id,
        userId,
        name,
        type,
        isPublic: true,
        parentId,
      });
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }

  static async putUnpublish(req, res) {
    try {
      const userToken = await req.header('x-token');
      const idUser = await redisClient.get(`auth_${userToken}`);
      if (!idUser) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { id: fileId } = await req.params;

      const file = await mongodbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(fileId.toString()) });

      if (!file || file.userId !== idUser) {
        return res.status(404).send({ error: 'Not found' });
      }
      const {
        _id: id,
        userId,
        name, type,
        parentId,
      } = file;

      await mongodbClient.db
        .collection('files')
        .updateOne(
          { _id: ObjectId(fileId.toString()) },
          { $set: { isPublic: false } },
        );

      return res.status(200).send({
        id,
        userId,
        name,
        type,
        isPublic: false,
        parentId,
      });
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }

  static async getFile(req, res) {
    try {
      const fileId = await req.params.id;
      const { size } = await req.query;
      const userToken = req.header('X-token');
      const userId = await redisClient.get(`auth_${userToken}`);

      const file = await mongodbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(fileId.toString()) });

      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }

      if (
        (!file.isPublic && !userId) || (!file.isPublic && file.userId !== userId)
      ) {
        return res.status(404).send({ error: 'Not found' });
      }

      if (file.type === 'folder') {
        return res.status(400).send({ error: "A folder doesn't have content" });
      }
      const localPath = size !== undefined ? `${file.localPath}_${size}` : file.localPath;
      const mimeType = mime.lookup(file.name);
      // const fileContent = await fs.readFile(localPath, 'utf-8');
      const fileContent = file.type === 'file'
        ? await fs.readFile(localPath, 'utf-8')
        : await fs.readFile(localPath);

      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(fileContent);
    } catch (error) {
      console.log(111);
      return res.status(404).send({ error: 'Not found' });
    }
  }
}

module.exports = FilesController;
