// const mongodbClient = require('./utils/db');
import { ObjectID } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import Queue from 'bull';
import mongodbClient from './utils/db';

const fs = require('fs');

const fileQueue = new Queue('image transcoding');
const userQueue = new Queue('welcome user');

fileQueue.process(async (job, done) => {
  try {
    const { fileId, userId } = await job.data;
    if (!fileId) {
      throw new Error('Missing fileId');
    }
    if (!userId) {
      throw new Error('Missing userId');
    }
    const file = await mongodbClient.db
      .collection('files')
      .findOne({ _id: ObjectID(fileId.toString()) });

    if (!file || file.userId !== userId) {
      throw new Error('File not found');
    }
    const imageBuffer = fs.readFileSync(file.localPath);

    const sizes = [500, 250, 100];

    /* eslint-disable no-await-in-loop */
    for (const size of sizes) {
      const localPath = `${file.localPath}_${size}`;
      const thumbnail = await imageThumbnail(imageBuffer, { width: size });
      fs.writeFileSync(localPath, thumbnail);
    }
    /* eslint-enable no-await-in-loop */
    done();
  } catch (error) {
    throw new Error('File not found');
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }
  const users = mongodbClient.db.collection('users');
  const user = await users.findOne({ _id: new ObjectID(userId) });

  if (user) {
    console.log(`Welcome ${user.email}!`);
  } else {
    throw new Error('User not found');
  }
});
export default fileQueue;
// const fileQueue = new Queue('image transcoding');

// const processJob = async () => {
//   try {
//     const job = await fileQueue.add({
//       fileId: '65eb991f9067a74326a68459',
//       userId: '65ea4ef10ba3f86fbed59bde',
//     });

//     fileQueue.on('completed', (completedJob) => {
//       if (completedJob.id === job.id) {
//         console.log('Job completed');
//         process.exit(0); // Close the process after the job is completed
//       }
//     });

//     fileQueue.on('failed', (failedJob, err) => {
//       if (failedJob.id === job.id) {
//         console.error(err.message);
//         process.exit(1); // Close the process with an error code after a job failure
//       }
//     });
//   } catch (error) {
//     console.error(error.message);
//     process.exit(1); // Close the process with an error code if there is an exception
//   }
// };

// processJob();
