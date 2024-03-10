import dbClient from '../utils/db';

const request = require('request');
const { expect } = require('chai');

describe('appController APIs', () => {
  it('status page', (done) => {
    request.get('http://localhost:5000/status', (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.deep.equal({ redis: true, db: true });
      done();
    });
  });

  it('stats page', (done) => {
    request.get('http://localhost:5000/stats', async (error, response, body) => {
      const nbUsers = await dbClient.nbUsers();
      const nbFiles = await dbClient.nbFiles();
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.deep.equal({ users: nbUsers, files: nbFiles });
      done();
    });
  });
});
