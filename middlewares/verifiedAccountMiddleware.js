const { Profile } = require("../models/profileModel");

const verifyAccount =async (req, res, next) => {
  if (req.email) {
    const profile = await Profile.profileData(req.email);
    if (!profile.verified_account) {
      
    }
  }
  next()
};

module.exports = verifyAccount;
  