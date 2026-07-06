'use strict';

module.exports = {
  async up(queryInterface) {
    // Standard US adult sizes (men's half-size increments 5–16, covers women's 6.5–17.5)
    const adultSizes = [
      5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5,
      10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16
    ];

    // Big kids / Youth sizes (3.5Y–7Y)
    const youthSizes = [3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

    // Little kids (1C–3Y)
    const littleKidsSizes = [1, 1.5, 2, 2.5, 3];

    const rows = [];
    let sort = 0;

    adultSizes.forEach(us => {
      rows.push({
        us_size:    us,
        label:      us % 1 === 0 ? String(us) : String(us),
        sort_order: sort++
      });
    });

    youthSizes.forEach(us => {
      rows.push({
        us_size:    us,
        label:      `${us}Y`,
        sort_order: sort++
      });
    });

    littleKidsSizes.forEach(us => {
      rows.push({
        us_size:    us,
        label:      `${us}C`,
        sort_order: sort++
      });
    });

    await queryInterface.bulkInsert('shoe_sizes', rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('shoe_sizes', null, {});
  }
};