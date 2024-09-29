class filterController {
    static filterMatches = (req, res) => {
        const { ageGap, location, fameRate, interests } = req.query;
      
        // Use the parameters for filtering logic
        const filters = {
          ageGap: ageGap ? Number(ageGap) : undefined,
          location: location || undefined,
          fameRate: fameRate ? Number(fameRate) : undefined,
          interests: interests ? interests.split(',') : undefined,
        };
      
        // Your logic to filter the matches using the filters object
        // Example: Use filters.ageGap, filters.location, etc.
        
        res.json({ message: "Filter matches result", filters });
      };
}

module.exports = filterController;