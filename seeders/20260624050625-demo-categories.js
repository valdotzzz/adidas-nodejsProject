'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('categories', [
      {
        name: 'Running',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Lifestyle',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Basketball',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { 
      ignoreDuplicates: true 
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('categories', null, {});
  }
};