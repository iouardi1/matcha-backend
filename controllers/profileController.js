const jwt = require('jsonwebtoken')
const { Profile } = require('../models/profileModel')
const bcrypt = require("bcrypt");
const db = require('../db/db');
const AuthController = require('./authController');
const { v4: uuidv4 } = require('uuid');

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

    static async updateProfile(req, res) {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        const { email } = jwt.decode(token)
        const { username, firstname, lastname, gender, interests, relationship_type, interested_in_gender, bio, location, user_email, password } = req.body;
        try {

            const genderQuery = `SELECT id FROM gender g WHERE g.name = $1 LIMIT 1;`;
            const genderResult = await db.query(genderQuery, [gender]);
            const genderId = genderResult.rows[0]?.id;
            
            if (!genderId) {
                return res.status(400).json({ message: 'Invalid gender' });
            }
            
            let interestedInGenderId = null;
            if (interested_in_gender) {
                const interestedInGenderQuery = `SELECT id FROM gender WHERE name = $1 LIMIT 1`;
                const interestedInGenderResult = await db.query(interestedInGenderQuery, [interested_in_gender]);
                interestedInGenderId = interestedInGenderResult.rows[0]?.id;
                
                if (!interestedInGenderId) {
                    return res.status(400).json({ message: 'Invalid interested in gender' });
                }
            }
            
            // Update interested_in_gender
            if (interestedInGenderId) {
                const interestedInGenderQuery = `
                UPDATE interested_in_gender
                SET gender_id = $1
                WHERE user_id = (SELECT id FROM users WHERE email = $2)
                `;
                await db.query(interestedInGenderQuery, [interestedInGenderId, email]);
            }
            
            let relationshipTypeId = null;
            if (relationship_type) {
                const relationshipTypeQuery = `SELECT id FROM relationship_type WHERE name = $1 LIMIT 1`;
                const relationshipTypeResult = await db.query(relationshipTypeQuery, [relationship_type]);
                relationshipTypeId = relationshipTypeResult.rows[0]?.id;
                
                if (!relationshipTypeId) {
                    return res.status(400).json({ message: 'Invalid relationship type' });
                }
            }
            
            if (relationshipTypeId) {
                const relationshipUpdateQuery = `
                UPDATE interested_in_relation
                SET relationship_type_id = $1
                WHERE user_id = (SELECT id FROM users WHERE email = $2)
                `;
                await db.query(relationshipUpdateQuery, [relationshipTypeId, email]);
            }
            
            // Update interests
            if (interests && interests.length > 0) {
                // Delete current interests and insert new ones
                const deleteInterestsQuery = `
                DELETE FROM user_interests
                WHERE user_id = (SELECT id FROM users WHERE email = $1)
                `;
                await db.query(deleteInterestsQuery, [email]);
                
                const updateInterestsQuery = `
                WITH interest_ids AS (
                    SELECT id
                    FROM interests
                    WHERE name = ANY($2::text[])
                    )
                    INSERT INTO user_interests (user_id, interest_id)
                    VALUES (
                        (SELECT id FROM users WHERE email = $1),
                        unnest(ARRAY(SELECT id FROM interest_ids))
                        )
                        ON CONFLICT DO NOTHING;
                        `;
                        
                        await db.query(updateInterestsQuery, [email, interests]);
                    }
                    
                    
                    const hashedPassword = await bcrypt.hash(password, 10);
                    
                    
                    const query = `
                    UPDATE users
                    SET 
                    username = $1,
                    firstname = $2,
                    lastname = $3,
                    gender_id = $4,
                    aboutme = $5,
                    location = $6,
                    password = $7,
                    email = $8
                    WHERE email = $9
                    `;
                    
                    const userUpdateValues = [username, firstname, lastname, genderId, bio, location, hashedPassword, user_email, email];
                    const updated = await db.query(query, userUpdateValues);
                    
                    if (email !== user_email) {
                        const verificationToken = uuidv4().replace(/-/g, '');
                        const query = `
                                UPDATE users
                                SET 
                                    verified_account = false,
                                    verification_token = $1
                                WHERE email = $2
                            `
                        await db.query(query, [verificationToken, user_email])
                        await AuthController.sendVerificationEmail(user_email, verificationToken);
                        // return res.status(200).json({ data: updated.rows[0] })
                        return res.status(403).json({ shouldRedirect: true, redirectTo: '/auth/login' });
                    }
                    
                    // return res.status(200).json({ data: updated.rows[0] })
        return res.status(200).json({ shouldRedirect: true, redirectTo: '/accueil' });


        } catch (error){
            console.error('Error updating profile: ', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = ProfileController
