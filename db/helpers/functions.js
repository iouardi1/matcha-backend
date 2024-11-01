const select = require('../../repositories/selectRepo')
const db = require('../db')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
const { rows } = require('pg/lib/defaults')

async function findUserIdByEmail(email) {
    const { id } = await select('users', ['id'], [['email', email]])
    return id
}

async function findEmailByUserId(id) {
    const { email } = await select('users', ['email'], [['id', id]])
    return email
}

async function findUsernameIdByEmail(email) {
    const { username } = await select('users', ['username'], [['email', email]])
    return username
}

async function findGenderIdByName(name) {
    const { id } = await select('gender', ['id'], [['name', name]])
    return id
}

async function findInterestIdByName(name) {
    const { id } = await select('interests', ['id'], [['name', name]])
    return id
}
async function calculateAge(birthday) {
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--
    }
    return age
}

async function findRelationIdByName(name) {
    const { id } = await select('relationship_type', ['id'], [['name', name]])
    return id
}

async function getNotifSenderData(email) {
    const { rows } = await db.query(
        `
			SELECT
					u.username AS sender,
					up.photo_url AS profile_picture
			FROM users u 
			JOIN user_photo up ON up.user_id = u.id
			WHERE u.email = $1;
			`,
        [email]
    )
    return rows
}

async function deleteUserImage(id, photo_url) {
    const { rows } = await db.query(
        `
			DELETE FROM user_photo
            WHERE user_id = $1 AND photo_url = $2;
			`,
        [id, photo_url]
    )
    return rows
}

async function updatePhotos(userId, photos) {
    try {
        for (let i = 0; i < photos.length; i++) {
            const { src } = photos[i]
            const isActive = i === 0 // Set active to true for the first photo, false for others

            const { rows } = await db.query(
                `SELECT 1 FROM user_photo WHERE user_id = $1 AND photo_url = $2`,
                [userId, src]
            )

            if (rows.length === 0) {
                await db.query(
                    `INSERT INTO user_photo (user_id, photo_url, active) VALUES ($1, $2, $3)`,
                    [userId, src, isActive]
                )
                console.log(`Photo ${src} added successfully.`)
            } else {
                console.log(`Photo ${src} already exists, skipping.`)
            }
        }
    } catch (error) {
        console.error('Error inserting photos:', error)
        throw error
    }
}   

async function updateBasicInfo(userId, newUserData) {
    try {
        // Fetch existing user data including relationship_type
        const {
            rows: [existingUser],
        } = await db.query(
            `SELECT username, firstname, lastname, aboutme, birthday, gender_id FROM users WHERE id = $1`,
            [userId]
        )
        if (!existingUser) throw new Error('User not found')

        const updates = []
        const params = []

        // Helper function to update fields in the user table if values have changed
        const addFieldUpdate = (field) => {
            if (
                newUserData[field] &&
                newUserData[field] !== existingUser[field]
            ) {
                updates.push(`${field} = $${params.length + 1}`)
                params.push(newUserData[field])
            }
        }

        // Update basic fields
        ;['username', 'firstname', 'lastname', 'aboutme', 'birthday'].forEach(
            addFieldUpdate
        )

        // Update gender_id if it has changed
        if (newUserData.gender) {
            const {
                rows: [genderRecord],
            } = await db.query(`SELECT id FROM gender WHERE name = $1`, [
                newUserData.gender,
            ])

            if (genderRecord && genderRecord.id !== existingUser.gender_id) {
                updates.push(`gender_id = $${params.length + 1}`)
                params.push(genderRecord.id)

                const {
                    rows: [oppositeGenderRecord],
                } = await db.query(`SELECT id FROM gender WHERE id != $1`, [
                    genderRecord.id,
                ])

                if (oppositeGenderRecord) {
                    await db.query(
                        `UPDATE interested_in_gender 
                         SET gender_id = $1 
                         WHERE user_id = $2`,
                        [oppositeGenderRecord.id, userId]
                    )
                }
            }
        }

        // Update interests if they have changed
        if (newUserData.interests) {
            const { rows: existingInterests } = await db.query(
                `SELECT interest_id FROM user_interests WHERE user_id = $1`,
                [userId]
            )

            const existingInterestIds = existingInterests.map(
                (row) => row.interest_id
            )
            const interestIds = await Promise.all(
                newUserData.interests.map(async (interestName) => {
                    const {
                        rows: [interest],
                    } = await db.query(
                        `SELECT id FROM interests WHERE name = $1`,
                        [interestName]
                    )

                    return interest ? interest.id : null
                })
            )

            const interestsToAdd = interestIds.filter(
                (id) => id && !existingInterestIds.includes(id)
            )
            const interestsToDelete = existingInterestIds.filter(
                (id) => !interestIds.includes(id)
            )

            if (interestsToAdd.length > 0 || interestsToDelete.length > 0) {
                await db.query(
                    `DELETE FROM user_interests WHERE user_id = $1 AND interest_id = ANY($2)`,
                    [userId, interestsToDelete]
                )

                if (interestsToAdd.length > 0) {
                    const values = interestsToAdd
                        .map((_, i) => `($1, $${i + 2})`)
                        .join(', ')
                    await db.query(
                        `INSERT INTO user_interests (user_id, interest_id) VALUES ${values}`,
                        [userId, ...interestsToAdd]
                    )
                }
            }
        }

        // Update relationship_type if it has changed
        if (newUserData.relation_type) {
            console.log('object')
            // Get the id of the new relationship type name provided
            const {
                rows: [relationshipType],
            } = await db.query(
                `SELECT id FROM relationship_type WHERE name = $1`,
                [newUserData.relation_type]
            )

            console.log(relationshipType)
            if (relationshipType) {
                // Check the current relationship type for the user
                const {
                    rows: [existingRelationship],
                } = await db.query(
                    `SELECT relationship_type_id FROM interested_in_relation WHERE user_id = $1`,
                    [userId]
                )

                // Update only if the relationship type has changed
                if (
                    !existingRelationship ||
                    relationshipType.id !==
                        existingRelationship.relationship_type_id
                ) {
                    if (existingRelationship) {
                        // Update existing relationship type
                        await db.query(
                            `UPDATE interested_in_relation SET relationship_type_id = $1 WHERE user_id = $2`,
                            [relationshipType.id, userId]
                        )
                    } else {
                        // Insert new relationship type if no record exists
                        await db.query(
                            `INSERT INTO interested_in_relation (user_id, relationship_type_id) VALUES ($1, $2)`,
                            [userId, relationshipType.id]
                        )
                    }
                }
            }
        }

        // Execute accumulated user table updates
        if (updates.length > 0) {
            const updateQuery = `UPDATE users SET ${updates.join(
                ', '
            )} WHERE id = $${params.length + 1}`
            params.push(userId)
            await db.query(updateQuery, params)
        }
    } catch (error) {
        console.error('Error updating user:', error)
        throw error
    }
}

async function updateUserCredentials(
    userId,
    newEmail,
    newPassword,
    verificationToken
) {
    try {
        // Fetch existing user details, including auth_provider
        const {
            rows: [existingUser],
        } = await db.query(
            `SELECT email, password, auth_provider FROM users WHERE id = $1`,
            [userId]
        )
        if (!existingUser) throw new Error('User not found')

        // Prevent updates if the user is logged in with Google
        if (existingUser.auth_provider === 'google') {
            return {
                message:
                    'Updates to email or password are not allowed for Google-authenticated users.',
            }
        }

        const updates = []
        const params = []

        // Check if email has changed
        if (newEmail && newEmail !== existingUser.email) {
            const query = `
                UPDATE users
                SET
                    verified_account = false,
                    verification_token = $1
                WHERE email = $2
            `
            await db.query(query, [verificationToken, existingUser.email])
            updates.push(`email = $${params.length + 1}`)
            params.push(newEmail)
        }

        // Check if password has changed and is non-empty
        let passwordNeedsUpdate = false
        if (newPassword && newPassword.trim() !== '') {
            const passwordMatch = await bcrypt.compare(
                newPassword,
                existingUser.password
            )
            if (!passwordMatch) {
                // Hash the new password if it doesn't match the existing hash
                const hashedPassword = await bcrypt.hash(newPassword, 10)
                updates.push(`password = $${params.length + 1}`)
                params.push(hashedPassword)
                passwordNeedsUpdate = true
            }
        }

        // Update the database if any changes were detected
        if (updates.length > 0) {
            const updateQuery = `UPDATE users SET ${updates.join(
                ', '
            )} WHERE id = $${params.length + 1}`
            params.push(userId)
            await db.query(updateQuery, params)

            return {
                emailUpdated: {
                    updated: newEmail !== existingUser.email,
                    newEmail: newEmail,
                },
                passwordUpdated: passwordNeedsUpdate,
            }
        } else {
            console.log('No changes detected, no update performed.')
            return { message: 'No changes detected' }
        }
    } catch (error) {
        console.error('Error updating user credentials:', error)
        throw error
    }
}

async function changeStatus(status, email) {
    await db.query(`UPDATE  users SET status = $1 where email = $2`, [
        status,
        email,
    ])
    if (status === 'online') {
        await db.query(`UPDATE  users SET last_seen = null where email = $1`, [
            email,
        ])
    } else if (status === 'offline') {
        await db.query(`UPDATE  users SET last_seen = NOW() where email = $1`, [
            email,
        ])
    }
}

module.exports = {
    findUserIdByEmail,
    findGenderIdByName,
    findInterestIdByName,
    calculateAge,
    findRelationIdByName,
    findUsernameIdByEmail,
    getNotifSenderData,
    findEmailByUserId,
    deleteUserImage,
    updatePhotos,
    updateBasicInfo,
    updateUserCredentials,
    changeStatus,
}
