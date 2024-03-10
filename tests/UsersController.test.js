const request = require('request');
const { expect } = require('chai');

describe('usersController APIs', () => {
  const email = `test${Math.random()}@test.com`;
  const password = 'test123';
  let userToken;

  it('request for the users page with email is missing', (done) => {
    request.post('http://localhost:5000/users', { json: { password } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(400);
        expect(body).to.deep.equal({ error: 'Missing email' });
        done();
      });
  });

  it('request for the users page with password is missing', (done) => {
    request.post('http://localhost:5000/users', { json: { email } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(400);
        expect(body).to.deep.equal({ error: 'Missing password' });
        done();
      });
  });

  it('request for the users page using email and password', (done) => {
    request.post('http://localhost:5000/users', { json: { email, password } },
      (error, response) => {
        expect(response.statusCode).to.equal(201);
        done();
      });
  });

  it('request for the users page using email already exist', (done) => {
    request.post('http://localhost:5000/users', { json: { email, password } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(400);
        expect(body).to.deep.equal({ error: 'Already exist' });
        done();
      });
  });

  it('request for the connect page', (done) => {
    const credentials = `${email}:${password}`;
    const base64Credentials = Buffer.from(credentials, 'utf-8').toString('base64');

    request.get('http://localhost:5000/connect', { headers: { Authorization: `basic ${base64Credentials}` } },
      (error, response, body) => {
        userToken = JSON.parse(body).token;
        done();
      });
  });

  it('request for the /users/me page with valid user token', (done) => {
    request.get('http://localhost:5000/users/me', { headers: { 'x-token': userToken } },
      (error, response) => {
        expect(response.statusCode).to.equal(200);
        done();
      });
  });

  it('request for the /users/me page with invalid user token', (done) => {
    request.get('http://localhost:5000/users/me', { headers: { 'x-token': '' } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
  });
});
