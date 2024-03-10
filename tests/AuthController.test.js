const request = require('request');
const { expect } = require('chai');

describe('authController APIs', () => {
  const email = `test${Math.random()}@test.com`;
  const password = 'test123';
  let userToken;

  it('request for the users page using email and password', (done) => {
    request.post('http://localhost:5000/users', { json: { email, password } },
      (error, response) => {
        expect(response.statusCode).to.equal(201);
        done();
      });
  });

  it('request for the connect page with valid email and password', (done) => {
    const credentials = `${email}:${password}`;
    const base64Credentials = Buffer.from(credentials, 'utf-8').toString('base64');

    request.get('http://localhost:5000/connect', { headers: { Authorization: `basic ${base64Credentials}` } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(200);
        userToken = JSON.parse(body).token;
        done();
      });
  });

  it('request for the connect page with wrong password', (done) => {
    const credentials = `${email}:${'wrongPassword'}`;
    const base64Credentials = Buffer.from(credentials, 'utf-8').toString('base64');

    request.get('http://localhost:5000/connect', { headers: { Authorization: `basic ${base64Credentials}` } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
  });

  it('request for the disconnect page with valid user token', (done) => {
    request.get('http://localhost:5000/disconnect', { headers: { 'x-token': userToken } },
      (error, response) => {
        expect(response.statusCode).to.equal(204);
        done();
      });
  });

  it('request for the disconnect page with invalid user token', (done) => {
    request.get('http://localhost:5000/disconnect', { headers: { 'x-token': '' } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
  });
});
