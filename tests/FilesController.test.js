const request = require('request');
const { expect } = require('chai');

describe('filesController APIs', () => {
  const email = `test${Math.random()}@test.com`;
  const password = 'test123';
  let userToken;
  let folderId;
  let fileId;

  it('post request for the users page using valid email and password', (done) => {
    request.post('http://localhost:5000/users', { json: { email, password } },
      (error, response) => {
        expect(response.statusCode).to.equal(201);
        done();
      });
  });

  it('send get request for the connect page with valid email and password', (done) => {
    const credentials = `${email}:${password}`;
    const base64Credentials = Buffer.from(credentials, 'utf-8').toString('base64');

    request.get('http://localhost:5000/connect', { headers: { Authorization: `basic ${base64Credentials}` } },
      (error, response, body) => {
        expect(response.statusCode).to.equal(200);
        userToken = JSON.parse(body).token;
        done();
      });
  });

  it('send post request for the upload file page using valid user token; type: folder', (done) => {
    const obj = {
      name: 'myText.txt',
      type: 'folder',
    };

    request.post('http://localhost:5000/files', {
      json: obj,
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(201);
      folderId = body.id;
      done();
    });
  });

  it('send post request for the upload file page using valid user token; type:file', (done) => {
    const obj = {
      name: 'myText.txt',
      type: 'file',
      data: 'YWJj',
    };

    request.post('http://localhost:5000/files', {
      json: obj,
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(201);
      fileId = body.id;
      done();
    });
  });

  it('send post request for the upload file page using valid user token; name missing', (done) => {
    const obj = {
      type: 'file',
      data: 'YWJj',
    };

    request.post('http://localhost:5000/files', {
      json: obj,
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(400);
      expect(body).to.deep.equal({ error: 'Missing name' });
      done();
    });
  });

  it('send post request for the upload file page using valid user token; type missing', (done) => {
    const obj = {
      name: 'myText.txt',
      data: 'YWJj',
    };

    request.post('http://localhost:5000/files', {
      json: obj,
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(400);
      expect(body).to.deep.equal({ error: 'Missing type' });
      done();
    });
  });

  it('send post request for the upload file page using valid user token; data missing for file/image type', (done) => {
    const obj = {
      name: 'myText.txt',
      type: 'file',
    };

    request.post('http://localhost:5000/files', {
      json: obj,
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(400);
      expect(body).to.deep.equal({ error: 'Missing data' });
      done();
    });
  });

  it('send post request for the upload file page using valid user token; wrong parent file id', (done) => {
    const obj = {
      name: 'myText.txt',
      type: 'file',
      data: 'YWJj',
      parentId: '65ee00e5eb5767a510235698',
    };

    request.post('http://localhost:5000/files', {
      json: obj,
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(400);
      expect(body).to.deep.equal({ error: 'Parent not found' });
      done();
    });
  });

  it('send post request for the upload file page using valid user token; parent file is not a folder', (done) => {
    const obj = {
      name: 'myText.txt',
      type: 'file',
      data: 'YWJj',
      parentId: fileId,
    };

    request.post('http://localhost:5000/files', {
      json: obj,
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(400);
      expect(body).to.deep.equal({ error: 'Parent is not a folder' });
      done();
    });
  });

  it('send post request for the get index file page using valid user token', (done) => {
    request.get('http://localhost:5000/files', {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.be.an('array');
      done();
    });
  });

  it('send post request for the get index file page using valid user token', (done) => {
    request.get(`http://localhost:5000/files/${fileId}`, {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body).id).to.equal(fileId);
      done();
    });
  });

  it('send post request for the get show file page using valid user token and wrong file id', (done) => {
    request.get('http://localhost:5000/files/65ee00b8137ebda3ee93ab00', {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('send post request for the get show file file page using valid file id; missing user token', (done) => {
    request.get(`http://localhost:5000/files/${fileId}`, {
      headers: { 'x-token': '' },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(401);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('send post request for the get show file file page using valid user token and valid file id', (done) => {
    request.put(`http://localhost:5000/files/${fileId}/publish`, {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body).isPublic).to.be.true;
      done();
    });
  });

  it('send post request for the publish file page using valid file id; invalid user token', (done) => {
    request.put(`http://localhost:5000/files/${fileId}/publish`, {
      headers: { 'x-token': '' },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(401);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('send post request for the publish file page using valid user token; invalid file id', (done) => {
    request.put('http://localhost:5000/files/65ee00b8137ebda3ee93ab00/publish', {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });


  it('send post request for the unpublish file page using valid user token and file id', (done) => {
    request.put(`http://localhost:5000/files/${fileId}/unpublish`, {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body).isPublic).to.be.false;
      done();
    });
  });

  it('send post request for the unpublish file page using valid file id; invalid user token', (done) => {
    request.put(`http://localhost:5000/files/${fileId}/unpublish`, {
      headers: { 'x-token': '' },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(401);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('send post request for the unpublish file page using valid user token; invalid file id', (done) => {
    request.put('http://localhost:5000/files/65ee00b8137ebda3ee93ab00/unpublish', {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('send post request for the data file page using valid user token and folder id', (done) => {
    request.get(`http://localhost:5000/files/${folderId}/data`, {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({ error: 'A folder doesn\'t have content' });
      done();
    });
  });

  it('send post request for the data file page using valid user token; invalid file id', (done) => {
    request.get('http://localhost:5000/files/65ee00b8137ebda3ee93ab00/data', {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('send post request for the data file page using valid file id and invalid user token', (done) => {
    request.get(`http://localhost:5000/files/${fileId}/data`, {
      headers: { 'x-token': '' },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('send post request for the data file page using valid user token and file id', (done) => {
    request.get(`http://localhost:5000/files/${fileId}/data`, {
      headers: { 'x-token': userToken },
    }, (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(body).to.equal('abc');
      done();
    });
  });
});
