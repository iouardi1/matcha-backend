const jwt = require('jsonwebtoken')
const { Profile } = require('../models/profileModel')

class ProfileController {
    static async getProfileDetails(req, res) {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        const { email } = jwt.decode(token)
        const profile = await Profile.profileData(email)
        return res.status(200).json({ data: profile })
    }

    static async getSetupProfile(req, res) {
        const { username } = await Profile.profileData(req.email)
        const { genders, interests, relationships } =
            await Profile.getSetupData()

        return res.status(200).json({
            username: username,
            genders: genders.map((gender) => gender.name),
            interests: interests.map((interest) => interest.name),
            relationships: relationships.map(
                (relationship) => relationship.name
            ),
        })
    }

    static async setupProfile(req, res) {
        const data = req.body
        const error = await Profile.profileSetup(data, req.email)
        if (error.error) {
            return res.status(400).json({ message: error.error })
        }
        return res
            .status(200)
            .json({ shouldRedirect: true, redirectTo: '/accueil' })
    }

    static async getProfileInfos(req, res) {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        const { email } = jwt.decode(token)
        const profile = await Profile.profileDataCustumized(email)
        return res.status(200).json({ data: profile })
    }

    static async getListOfMatches(req, res) {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        const { email } = jwt.decode(token)
        const matches = await Profile.getListOfMatches(email)
        return res.status(200).json({ data: matches })
    }

    static async getListOfNotif(req, res) {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        const { email } = jwt.decode(token)
        const notfis = await Profile.getListOfNotifs(email)
        return res.status(200).json({ data: notfis })
    }

    static async createNotif(req, res) {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        const { email } = jwt.decode(token)
        const data = req.body
        const notif = await Profile.createNotif(data, email)
        return res.status(200).json({ data: notif })
    }

    static async setupData(req, res) {
        const { genders, interests, relationships } =
            await Profile.getSetupData()
        return res.status(200).json({
            genders: genders.map((gender) => gender.name),
            interests: interests.map((interest) => interest.name),
            relationships: relationships.map(
                (relationship) => relationship.name
            ),
        })
    }
}

module.exports = ProfileController
