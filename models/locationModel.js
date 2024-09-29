const db = require("../db/db");

const Location = {
    saveLocation: async (location, email) => {
        try {
          const user = await db.query(
            `UPDATE public.users
             SET location = $1
             WHERE email = $2`,
            [location, email]
          );
          if (user.rowCount > 0) {
            return { success: true, message: 'Location updated successfully' };
          } else {
            return { success: false, message: 'No user found with the given ID' };
          }
        } catch (err) {
            console.error(err);
        }
    },
};

module.exports = { Location };
