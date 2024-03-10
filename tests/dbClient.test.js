import dbClient from '../utils/db';

const sinon = require('sinon');
const sha1 = require('sha1');
const { expect } = require('chai');

describe('dbClient', () => {
  let userId;

  it('dbClient constructor', async () => {
    const consoleSpy = sinon.spy(console, 'log');
    setTimeout(() => expect(consoleSpy.calledWithMatch('Connected successfully to server')).to.be.true, 10000);
    consoleSpy.restore();
  });

  it('isAlive dbClient method', async () => {
    expect(dbClient.isAlive()).to.be.true;
  });

  it('nbUsers dbClient method', async () => {
    const nbUsers = await dbClient.nbUsers();
    const hashedPassword = sha1('test123');
    userId = await dbClient.db
      .collection('users')
      .insertOne({ email: 'test@test.com', password: hashedPassword });
    expect(await dbClient.nbUsers()).to.equal(nbUsers + 1);
  });

  it('nbFiles dbClient method', async () => {
    const nbFiles = await dbClient.nbFiles();
    const obj = {
      userId,
      name: 'myTest.txt',
      type: 'file',
      isPublic: false,
      parentId: 0,
    };
    await dbClient.db.collection('files').insertOne({
      ...obj,
    });
    expect(await dbClient.nbFiles()).to.equal(nbFiles + 1);
  });
});
