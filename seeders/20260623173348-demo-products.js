'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Fetch categories to map foreign keys dynamically
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name FROM Categories;`
    );

    const getCategoryId = (name) => {
      const match = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      return match ? match.id : null;
    };

    // 2. Insert array of 21 varied product instances matching the model schema configurations
    return queryInterface.bulkInsert('products', [
      // ==========================================
      // RUNNING CATEGORY
      // ==========================================
      {
        name: 'Ultraboost Light',
        style_code: 'HQ6339',
        description: 'Experience epic energy with the new generation of lightweight cushioning.',
        price: 10000.00,
        gender: 'unisex',
        is_exclusive: true,
        category_id: getCategoryId('Running'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pureboost 23',
        style_code: 'IF2364',
        description: 'Daily running shoes featuring full-length BOOST responsive technology.',
        price: 7000.00,
        gender: 'men',
        is_exclusive: false,
        category_id: getCategoryId('Running'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Adizero Adios Pro 3',
        style_code: 'GX9777',
        description: 'The ultimate long-distance racing shoe designed for breakneck speed.',
        price: 13000.00,
        gender: 'unisex',
        is_exclusive: true,
        category_id: getCategoryId('Running'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Supernova Stride',
        style_code: 'IG8320',
        description: 'Comfortable everyday trainers with targeted Dreamstrike+ cushioning.',
        price: 5300.00,
        gender: 'women',
        is_exclusive: false,
        category_id: getCategoryId('Running'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Questar Flow Shoes',
        style_code: 'F36308',
        description: 'Cloudfoam cushioning provides pillow-soft comfort step after step.',
        price: 4500.00,
        gender: 'men',
        is_exclusive: false,
        category_id: getCategoryId('Running'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Duramo Speed',
        style_code: 'IF7881',
        description: 'Lightweight, breathable mesh running trainers for speed training tracks.',
        price: 4300.00,
        gender: 'kids',
        is_exclusive: false,
        category_id: getCategoryId('Running'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Response Runner',
        style_code: 'ID7335',
        description: 'Beginner-friendly road racing build equipped with a durable rubber outer layer.',
        price: 3300.00,
        gender: 'women',
        is_exclusive: false,
        category_id: getCategoryId('Running'),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ==========================================
      // LIFESTYLE CATEGORY
      // ==========================================
      {
        name: 'Samba OG Black',
        style_code: 'B75807',
        description: 'Born on the pitch, the Samba is a timeless icon of street style.',
        price: 5500.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: getCategoryId('Lifestyle'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Gazelle Bold',
        style_code: 'HQ6893',
        description: 'Classic Gazelle premium suede profile elevated on a triple-stacked platform sole.',
        price: 6500.00,
        gender: 'women',
        is_exclusive: true,
        category_id: getCategoryId('Lifestyle'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Superstar Classic White',
        style_code: 'EG4958',
        description: 'The world-famous full-grain leather sneaker with the classic shell toe design.',
        price: 5300.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: getCategoryId('Lifestyle'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Forum Low',
        style_code: 'FY7756',
        description: '80s hoops icon returning with its signature hook-and-loop ankle strap.',
        price: 5500.00,
        gender: 'men',
        is_exclusive: false,
        category_id: getCategoryId('Lifestyle'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'NMD_R1 V3',
        style_code: 'HP4316',
        description: 'Tactical textile upper meets ultra-cushioned responsive midsole.',
        price: 8500.00,
        gender: 'men',
        is_exclusive: false,
        category_id: getCategoryId('Lifestyle'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Campus 00s Core Black',
        style_code: 'HQ8708',
        description: 'Skate-inspired chunks update a heritage profile with fat laces.',
        price: 5500.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: getCategoryId('Lifestyle'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Stan Smith Lux',
        style_code: 'HP2201',
        description: 'Premium thick-cut leather build details an iconic minimalist low-top silhouette.',
        price: 8000.00,
        gender: 'men',
        is_exclusive: true,
        category_id: getCategoryId('Lifestyle'),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ==========================================
      // BASKETBALL CATEGORY
      // ==========================================
      {
        name: 'Harden Volume 7',
        style_code: 'HQ1419',
        description: 'James Hardens ultimate luxury performance on-court sneaker design.',
        price: 8500.00,
        gender: 'men',
        is_exclusive: true,
        category_id: getCategoryId('Basketball'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dame 8 EXTPLY',
        style_code: 'ID5660',
        description: 'Damian Lillards signature build fitted with dual-density Bounce Pro response.',
        price: 7500.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: getCategoryId('Basketball'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'D.O.N. Issue #5',
        style_code: 'IE8325',
        description: 'Donovan Mitchells ultra-lightweight sneaker layout for premium court agility.',
        price: 7000.00,
        gender: 'men',
        is_exclusive: false,
        category_id: getCategoryId('Basketball'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Trae Young 3',
        style_code: 'IF5600',
        description: 'Optimized traction configurations built for rapid cuts and explosive changes of direction.',
        price: 8000.00,
        gender: 'men',
        is_exclusive: false,
        category_id: getCategoryId('Basketball'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pro Boost Low',
        style_code: 'G58623',
        description: 'Responsive hybrid cushioning tailored for non-stop comfort during tough practice runs.',
        price: 6000.00,
        gender: 'women',
        is_exclusive: false,
        category_id: getCategoryId('Basketball'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Exhibit B Mid',
        style_code: 'GZ2341',
        description: 'A versatile mid-top platform providing solid lock-down and structural support for ankles.',
        price: 6500.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: getCategoryId('Basketball'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cross Em Up 5 Wide',
        style_code: 'GW7235',
        description: 'Durable wide-fit basketball shoes engineered to keep active kids moving comfortably.',
        price: 3500.00,
        gender: 'kids',
        is_exclusive: false,
        category_id: getCategoryId('Basketball'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { 
      ignoreDuplicates: true 
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('products', null, {});
  }
};