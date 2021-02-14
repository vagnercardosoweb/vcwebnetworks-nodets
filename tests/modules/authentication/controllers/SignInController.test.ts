import supertest from 'supertest';

import app from '@src/app';
import sequelize from '@src/database';
import { UserModel } from '@src/database/models/UserModel';

const makeUser = () =>
  UserModel.create({
    name: 'any_name',
    email: 'any_email@mail.com',
    password: 'any_password',
  });

const makeSupertest = () => supertest(app.getServer());

describe('Authentication -> SignInController', () => {
  afterAll(() => sequelize.close());
  beforeEach(() => sequelize.sync({ force: true }));

  it('should log in with valid credentials.', async () => {
    const user = await makeUser();
    const response = await makeSupertest().post('/auth/sign-in').send({
      email: user.email,
      password: 'any_password',
    });

    expect(response.status).toBe(200);
  });

  it('should check if you are trying to login with an invalid user.', async () => {
    const response = await makeSupertest().post('/auth/sign-in').send({
      email: 'invalid_email@mail.com',
      password: 'invalid_password',
    });

    expect(response.status).toBe(401);
    expect(response.body.name).toBe('UnauthorizedError');
  });

  it('should check if you are accessing with invalid credentials.', async () => {
    const user = await makeUser();
    const response = await makeSupertest().post('/auth/sign-in').send({
      email: user.email,
      password: 'any_password_wrong',
    });

    expect(response.status).toBe(401);
    expect(response.body.name).toBe('UnauthorizedError');
  });

  it('should return a jwt token for authentication.', async () => {
    const user = await makeUser();
    const response = await makeSupertest().post('/auth/sign-in').send({
      email: user.email,
      password: 'any_password',
    });

    expect(response.body).toHaveProperty('token');
  });

  it('should return with the correct properties.', async () => {
    const user = await makeUser();
    const response = await makeSupertest().post('/auth/sign-in').send({
      email: user.email,
      password: 'any_password',
    });

    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.name).toBe(user.name);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.password).toBeUndefined();
    expect(response.body.token).toBe(await user.generateJwtToken());
  });
});
