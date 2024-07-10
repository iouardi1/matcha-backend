const db =  require( "../db/db");
class UserController {
    static async getAllUsers(req, res) {
      // Fetch users data from your database or any other source
      try {
        const result = await db.query('SELECT * FROM user_account ORDER BY id ASC');
        res.send(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
    };

    static getUsersById(req, res) {
        
    };
  }
  
  module.exports = UserController;