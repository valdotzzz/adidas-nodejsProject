'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Resolve reference tables so we use real PKs everywhere
    const products  = await queryInterface.sequelize.query(
      `SELECT id, style_code FROM products;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const colorways = await queryInterface.sequelize.query(
      `SELECT id, name FROM colorways;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const sizes = await queryInterface.sequelize.query(
      `SELECT id, label FROM shoe_sizes ORDER BY sort_order;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const pidFor  = sc  => { const m = products.find(p => p.style_code === sc); if (!m) throw new Error(`No product: ${sc}`); return m.id; };
    const cwidFor = nm  => { const m = colorways.find(c => c.name === nm);      if (!m) throw new Error(`No colorway: ${nm}`); return m.id; };
    const sidFor  = lbl => { const m = sizes.find(s => String(s.label) === String(lbl)); if (!m) throw new Error(`No size: ${lbl}`); return m.id; };

    const now = new Date();
    const adultRun = ['8', '8.5', '9', '9.5', '10', '10.5', '11'];
    const youthRun = ['3.5Y', '4Y', '4.5Y', '5Y', '5.5Y', '6Y', '6.5Y'];
    const stockPat = i => [10, 15, 20, 5, 0, 12, 8][i % 7];

    const variants = [];
    const addRun = (sc, cw, sizes) => sizes.forEach((lbl, i) => variants.push({
      product_id: pidFor(sc), colorway_id: cwidFor(cw), size_id: sidFor(lbl),
      stock_level: stockPat(i), image_id: null, createdAt: now, updatedAt: now
    }));

    // RUNNING
    addRun('HQ6339', 'Core Black / Solar Lemon',             adultRun);
    addRun('HQ6339', 'Cloud White / Grey',                   adultRun);
    addRun('IF2364', 'Core Black',                           adultRun);
    addRun('GX9777', 'Core Black / Solar Lemon / Solar Purple', adultRun);
    addRun('GX9777', 'Cloud White / Core Black',             adultRun);
    addRun('IG8320', 'Pink / White',                         adultRun);
    addRun('F36308', 'Core Black',                           adultRun);
    addRun('IF7881', 'Blue / White',                         youthRun);
    addRun('ID7335', 'Grey / Pink',                          adultRun);

    // LIFESTYLE
    addRun('B75807', 'Core Black / Cloud White',             adultRun);
    addRun('HQ6893', 'Cloud White / Gold Metallic',          adultRun);
    addRun('HQ6893', 'Core Black',                           adultRun);
    addRun('EG4958', 'Cloud White / Core Black',             adultRun);
    addRun('FY7756', 'Cloud White / Core Black / Blue',      adultRun);
    addRun('HP4316', 'Core Black / Carbon',                  adultRun);
    addRun('HQ8708', 'Core Black / Off White',               adultRun);
    addRun('HP2201', 'Cloud White / Green',                  adultRun);

    // BASKETBALL
    addRun('HQ1419', 'Core Black / Solar Red',               adultRun);
    addRun('ID5660', 'Cloud White / Core Black',             adultRun);
    addRun('IE8325', 'Core Black / Gold',                    adultRun);
    addRun('IF5600', 'Navy / Orange',                        adultRun);
    addRun('G58623', 'Core Black / Pink',                    adultRun);
    addRun('GZ2341', 'Grey / Core Black',                    adultRun);
    addRun('GW7235', 'Core Black / Blue',                    youthRun);

    return queryInterface.bulkInsert('variants', variants, {});
  },

  async down(queryInterface) {
    return queryInterface.bulkDelete('variants', null, {});
  }
};