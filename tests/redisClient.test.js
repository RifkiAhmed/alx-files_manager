import redisClient from '../utils/redis';

const { expect } = require('chai');

describe('redisClient', () => {
  it('isAlive redisClient method', async () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('set redisClient method', async () => {
    await redisClient.set('myName', 'redisClientOne', 3600);
    expect(await redisClient.get('myName')).to.equal('redisClientOne');
  });

  it('get redisClient method', async () => {
    const Key = 'nonExistingKey';
    expect(await redisClient.get(Key)).to.equal(null);
  });

  it('del redisClient method', async () => {
    await redisClient.del('myName');
    expect(await redisClient.get('myName')).to.equal(null);
  });
});
