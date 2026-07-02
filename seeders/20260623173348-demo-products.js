'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Look up all categories so we can reference their real database IDs by name
    const categories = await queryInterface.sequelize.query(
      `SELECT id, name FROM categories;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Helper: find a category's real DB id from its name
    const categoryIdFor = (name) => {
      const match = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (!match) {
        throw new Error(`Seeder error: no category found with name "${name}". Ensure categories seeder ran first!`);
      }
      return match.id;
    };

    // Distinct timestamps to simulate record creation followed by a later update
    const createdDate = new Date('2026-05-01T08:00:00Z');
    const updatedDate = new Date('2026-06-23T17:33:48Z');

    const products = [
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
        category_id: categoryIdFor('Running'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Pureboost 23',
        style_code: 'IF2364',
        description: 'Daily running shoes featuring full-length BOOST responsive technology.',
        price: 7000.00,
        gender: 'men',
        is_exclusive: false,
        category_id: categoryIdFor('Running'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Adizero Adios Pro 3',
        style_code: 'GX9777',
        description: 'The ultimate long-distance racing shoe designed for breakneck speed.',
        price: 13000.00,
        gender: 'unisex',
        is_exclusive: true,
        category_id: categoryIdFor('Running'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Supernova Stride',
        style_code: 'IG8320',
        description: 'Comfortable everyday trainers with targeted Dreamstrike+ cushioning.',
        price: 5300.00,
        gender: 'women',
        is_exclusive: false,
        category_id: categoryIdFor('Running'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Questar Flow Shoes',
        style_code: 'F36308',
        description: 'Cloudfoam cushioning provides pillow-soft comfort step after step.',
        price: 4500.00,
        gender: 'men',
        is_exclusive: false,
        category_id: categoryIdFor('Running'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Duramo Speed',
        style_code: 'IF7881',
        description: 'Lightweight, breathable mesh running trainers for speed training tracks.',
        price: 4300.00,
        gender: 'kids',
        is_exclusive: false,
        category_id: categoryIdFor('Running'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Response Runner',
        style_code: 'ID7335',
        description: 'Beginner-friendly road racing build equipped with a durable rubber outer layer.',
        price: 3300.00,
        gender: 'women',
        is_exclusive: false,
        category_id: categoryIdFor('Running'),
        createdAt: createdDate,
        updatedAt: updatedDate
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
        category_id: categoryIdFor('Lifestyle'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Gazelle Bold',
        style_code: 'HQ6893',
        description: 'Classic Gazelle premium suede profile elevated on a triple-stacked platform sole.',
        price: 6500.00,
        gender: 'women',
        is_exclusive: true,
        category_id: categoryIdFor('Lifestyle'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Superstar Classic White',
        style_code: 'EG4958',
        description: 'The world-famous full-grain leather sneaker with the classic shell toe design.',
        price: 5300.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: categoryIdFor('Lifestyle'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Forum Low',
        style_code: 'FY7756',
        description: '80s hoops icon returning with its signature hook-and-loop ankle strap.',
        price: 5500.00,
        gender: 'men',
        is_exclusive: false,
        category_id: categoryIdFor('Lifestyle'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'NMD_R1 V3',
        style_code: 'HP4316',
        description: 'Tactical textile upper meets ultra-cushioned responsive midsole.',
        price: 8500.00,
        gender: 'men',
        is_exclusive: false,
        category_id: categoryIdFor('Lifestyle'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Campus 00s Core Black',
        style_code: 'HQ8708',
        description: 'Skate-inspired chunks update a heritage profile with fat laces.',
        price: 5500.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: categoryIdFor('Lifestyle'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Stan Smith Lux',
        style_code: 'HP2201',
        description: 'Premium thick-cut leather build details an iconic minimalist low-top silhouette.',
        price: 8000.00,
        gender: 'men',
        is_exclusive: true,
        category_id: categoryIdFor('Lifestyle'),
        createdAt: createdDate,
        updatedAt: updatedDate
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
        category_id: categoryIdFor('Basketball'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Dame 8 EXTPLY',
        style_code: 'ID5660',
        description: 'Damian Lillards signature build fitted with dual-density Bounce Pro response.',
        price: 7500.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: categoryIdFor('Basketball'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'D.O.N. Issue #5',
        style_code: 'IE8325',
        description: 'Donovan Mitchells ultra-lightweight sneaker layout for premium court agility.',
        price: 7000.00,
        gender: 'men',
        is_exclusive: false,
        category_id: categoryIdFor('Basketball'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Trae Young 3',
        style_code: 'IF5600',
        description: 'Optimized traction configurations built for rapid cuts and explosive changes of direction.',
        price: 8000.00,
        gender: 'men',
        is_exclusive: false,
        category_id: categoryIdFor('Basketball'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Pro Boost Low',
        style_code: 'G58623',
        description: 'Responsive hybrid cushioning tailored for non-stop comfort during tough practice runs.',
        price: 6000.00,
        gender: 'women',
        is_exclusive: false,
        category_id: categoryIdFor('Basketball'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Exhibit B Mid',
        style_code: 'GZ2341',
        description: 'A versatile mid-top platform providing solid lock-down and structural support for ankles.',
        price: 6500.00,
        gender: 'unisex',
        is_exclusive: false,
        category_id: categoryIdFor('Basketball'),
        createdAt: createdDate,
        updatedAt: updatedDate
      },
      {
        name: 'Cross Em Up 5 Wide',
        style_code: 'GW7235',
        description: 'Durable wide-fit basketball shoes engineered to keep active kids moving comfortably.',
        price: 3500.00,
        gender: 'kids',
        is_exclusive: false,
        category_id: categoryIdFor('Basketball'),
        createdAt: createdDate,
        updatedAt: updatedDate
      }
    ];

    return queryInterface.bulkInsert('products', products, { ignoreDuplicates: true });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('products', null, {});
  }
};