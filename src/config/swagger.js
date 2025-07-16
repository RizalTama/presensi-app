// config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger options
const options = {
  swaggerDefinition: {
    openapi: '3.0.0', // Versi OpenAPI
    info: {
      title: 'API Presensi',
      version: '1.0.0',
      description: 'Dokumentasi API untuk aplikasi presensi',
      contact: {
        name: 'Developer',
        url: 'http://localhost:3000',
        email: 'developer@example.com'
      }
    },
  },
  apis: ['./src/routes/*.js'], // Tempatkan file API Anda di sini
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
