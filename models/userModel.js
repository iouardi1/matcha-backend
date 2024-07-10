const db = require('../db/db');

const User = {
  create: async ({ firstname, lastname, email, password }) => {
    const { rows } = await db.query(
      'INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [firstname, lastname, email, password]
    );
    return rows[0];
  },

  findByEmail: async (email) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },
};

module.exports = { User };