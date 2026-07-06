'use strict';

module.exports = {
  async up(queryInterface) {
    const names = [
      // Running
      'Core Black / Solar Lemon',
      'Cloud White / Grey',
      'Core Black',
      'Core Black / Solar Lemon / Solar Purple',
      'Cloud White / Core Black',
      'Pink / White',
      'Blue / White',
      'Grey / Pink',
      // Lifestyle
      'Core Black / Cloud White',
      'Cloud White / Gold Metallic',
      'Cloud White / Core Black / Blue',
      'Core Black / Carbon',
      'Core Black / Off White',
      'Cloud White / Green',
      // Basketball
      'Core Black / Solar Red',
      'Cloud White / Core Black',   // duplicate — findOrCreate will skip it
      'Core Black / Gold',
      'Navy / Orange',
      'Core Black / Pink',
      'Grey / Core Black',
      'Core Black / Blue',
      // Extra
      'Solar Red',
      'Orbit Grey',
      'Signal Coral / Gold',
      'Pulse Mint / Silver',
      'Stone / Earth Brown',
      'Neon Yellow / Black',
    ];

    // Deduplicate before inserting
    const unique = [...new Set(names)];
    const now = new Date();
    const rows = unique.map(name => ({ name, createdAt: now, updatedAt: now }));

    await queryInterface.bulkInsert('colorways', rows, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('colorways', null, {});
  }
};