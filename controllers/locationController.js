const jwt = require("jsonwebtoken");
const { Location } = require("../models/locationModel");

class locationController {

    static getLocation = async (req, res) => {
        try {
          const token = req.header("Authorization")?.replace("Bearer ", "");
          const { email } = jwt.decode(token);

          const response = await fetch("https://ipinfo.io/json");
          
          if (!response.ok) {
            return res.status(response.status).json({ error: "Failed to fetch IP-based location" });
          }
      
          const data = await response.json();

          if (!data?.loc) {
            return res.status(400).json({ error: "Location data is not available" });
          }
          const saveUserLocation = await Location.saveLocation(data.loc, email);
          return res.status(200).json( data.loc );
      
        } catch (error) {
          console.error("Error getting IP-based location:", error);
          return res.status(500).json({ error: "Failed to get location data" });
        }
      };

    static async saveLocation(req, res) {
        try {
            const token = req.header("Authorization")?.replace("Bearer ", "");
		    const { email } = jwt.decode(token);
            const {latitude, longitude} = req.body;
            const location = `${latitude},${longitude}`
            const saveUserLocation = await Location.saveLocation(location, email);
            return res.status(200).json({ message: saveUserLocation?.message });

        } catch (error) {
            console.error("Error: ", error);
            res.status(500).json({ error: "Failed to save location data" });
        }
    };
}

module.exports = locationController;