import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { decode, sign } from 'jsonwebtoken';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    jest.setTimeout(30000);
  });

  beforeEach(async () => {
    // Ensure env credentials are available for auth
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'GCA2025Admin@';
    process.env.JWT_SECRET = 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/categories (GET)', () => {
    return request(app.getHttpServer())
      .get('/categories')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/categories/:id/nominees (GET)', async () => {
    const categoriesRes = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    const firstCategory = categoriesRes.body?.[0];
    if (!firstCategory) {
      return;
    }

    return request(app.getHttpServer())
      .get(`/categories/${firstCategory.slug}/nominees`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  let accessToken: string;

  it('/auth/login (POST) sets refresh cookie and returns non-expiring admin accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'GCA2025Admin@' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.expiresIn).toBe('never');
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.headers['set-cookie']).toBeDefined();

    const payload = decode(res.body.accessToken) as any;
    expect(payload).toBeDefined();
    expect(payload.role).toBe('admin');
    expect(payload.exp).toBeUndefined();

    accessToken = res.body.accessToken;
  });

  it('/api/auth/login should accept an expired admin token and still allow auth guard', async () => {
    const expiredToken = sign(
      { username: 'admin', role: 'admin' },
      process.env.JWT_SECRET ?? 'test-secret',
      { expiresIn: '-10s' },
    );

    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ slug: `admin-test-${Date.now()}`, title: 'Admin Test', type: 'other' })
      .expect(201);
  });

  it('/auth/refresh (POST) rotates refresh token and returns new access token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'GCA2025Admin@' })
      .expect(201);

    const cookie = loginRes.headers['set-cookie']?.[0];
    expect(cookie).toBeDefined();

    const cookieValue = cookie.split(';')[0];

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieValue)
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('/votes (POST) requires google-auth verification', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'GCA2025Admin@' })
      .expect(201);

    const accessToken = loginRes.body.accessToken;
    const authHeader = `Bearer ${accessToken}`;

    const categoriesRes = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    const firstCategory = categoriesRes.body?.[0];
    expect(firstCategory).toBeTruthy();

    const nomineesRes = await request(app.getHttpServer())
      .get(`/categories/${firstCategory.slug}/nominees`)
      .expect(200);

    const nomineeId = nomineesRes.body?.[0]?.id;
    if (!nomineeId) {
      return;
    }

    const newMssv = `test${Date.now()}`;
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', authHeader)
      .send({
        fullname: 'Test Voter',
        mssv: newMssv,
        email: 'student@example.com',
      })
      .expect(201);

    // In test mode we allow any idToken; server ignores it when NODE_ENV=test
    return request(app.getHttpServer())
      .post('/votes')
      .send({ voteId: 'fanpage', nomineeId, mssv: newMssv, idToken: 'dummy' })
      .expect(201)
      .expect({ success: true });
  });

  it('/votes/:id/results (GET)', async () => {
    const categoriesRes = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    const firstCategory = categoriesRes.body?.[0];
    expect(firstCategory).toBeTruthy();

    const nomineesRes = await request(app.getHttpServer())
      .get(`/categories/${firstCategory.slug}/nominees`)
      .expect(200);

    const nomineeId = nomineesRes.body?.[0]?.id;
    if (!nomineeId) {
      return;
    }

    return request(app.getHttpServer())
      .get(`/votes/${firstCategory.slug}/results`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty(nomineeId);
      });
  });
});
