const request = require('supertest');
const express = require('express');

// Importa el servidor principal y el pool
const { app, pool } = require('./server');

describe('Servidor Express', () => {
  it('debería responder en la ruta raíz', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('<html');
  });

  afterAll(async () => {
    await pool.end();
  });
});
