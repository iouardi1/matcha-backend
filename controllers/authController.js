const nodemailer = require('nodemailer')
const jwt = require("jsonwebtoken");
const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.JWT_SECRET;
const { v4: uuidv4 } = require('uuid');

const verificationCodes = new Map();

class AuthController {

    static async sendVerificationEmail(email, token) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Verify Your Email',
                html: `
					<h1>Email Verification</h1>
					<p>Please click the link below to verify your email:</p>
					<a href="${process.env.CLIENT_URL}/auth/verifyEmail?token=${token}">Verify Email</a>
				`
            };

            // Send the email
            const result = await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: "Internal Server Error" })
        }
    }

    static async registerUser(req, res) {
        const { firstname, lastname, username, email, password } = req.body;

        if (!firstname || !lastname || !username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

		const verificationToken = uuidv4().replace(/-/g, '');
	
		try {
			// Create the new user with the verification token and set isVerified to false
			const newUser = await User.create({
				firstname,
				lastname,
				username,
				famerate: 10,
				email,
				password: hashedPassword,
				verified_account: false,
				verification_token: verificationToken,
			});

            // await sendVerificationEmail(newUser.email, verificationToken);
            await AuthController.sendVerificationEmail(
                newUser.email,
                verificationToken
            )

			return res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
		} catch (error) {
			if (error.code === "23505" && error.constraint === "unique_email") {
				return res.status(400).json({ message: "Email already exists" });
			}
			// console.log('error: ' + error);
			return res.status(500).json({ message: "Internal Server Error" });
		}
	}

    static async verifyEmail(req, res) {
        const { token } = req.query
        // console.log('token: ', token);

        try {
            const user = await User.findByVerificationToken(token)

            if (!user) {
                return res
                    .status(400)
                    .json({ message: 'Invalid or expired token' })
            }

            const updatedUser = await User.updateVerifiedAccount(user.id)

            if (updatedUser) {
                return res
                    .status(200)
                    .json({ message: 'Email verified successfully' })
            }

            return res.status(404).json({ message: 'User not found' })
        } catch (error) {
            // console.log('error: ', error);
            res.status(500).json({ message: 'Internal Server Error' })
        }
    }

    static async sendVerificationCode(req, res) {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        try {
            const user = await User.findByEmail(email)

            if (!user) {
                return res.status(400).json({ error: "Email doesn't exist" })
            }
            const verificationCode = Math.floor(100000 + Math.random() * 900000)
            const codeId = uuidv4()

            // Store the verification code with an expiration time (e.g., 5 minutes)
            verificationCodes.set(codeId, {
                email,
                code: verificationCode,
                expiresAt: Date.now() + 5 * 60 * 1000,
            })

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
            })

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Matcha Verification Code',
                text: `Your verification code is ${verificationCode}`,
            }

            // Send the email
            const result = await transporter.sendMail(mailOptions)

            res.status(200).json({
                message: 'Verification code sent successfully',
                codeId,
            })
        } catch (error) {
            console.error('Error sending email:', error)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    static async verifyCodeUser(req, res) {
        const { email, code, codeId } = req.body

		if ( !email || !code) {
			return res.status(400).json({ message: "All fields are required" });
		}

		if (!codeId ) {
			return res.status(400).json({ message: "Invalid Verification code" });
		}

        try {
            const user = await User.findByEmail(email)

			if (!user) {
				return res.status(400).json({ message: "Email doesn't exist" });
			}
			const storedCodeData = verificationCodes.get(codeId);

			if (!storedCodeData) {
				return res.status(400).json({ message: "Invalid or expired verification code" });
			}

            const {
                email: storedEmail,
                code: storedCode,
                expiresAt,
            } = storedCodeData

			if (Date.now() > expiresAt) {
				verificationCodes.delete(codeId);
				return res.status(400).json({ message: "Verification code expired" });
			}

			if (parseInt(code, 10) !== storedCode) {
				return res.status(400).json({ message: "Invalid verification code" });
			}

			// Verification successful
			// verificationCodes.delete(codeId);
			res.status(200).json({ message: "Verification successful", email: storedEmail });

		} catch (error) {
		console.error('Error verifying code:', error);
		return res.status(500).json({ error: "Internal Server Error" });
		}
  	}
	static async resetPasswordUser(req, res) {
		const { password, codeId } = req.body;
		if ( !password || !codeId ) {
			return res.status(400).json({ message: "All fields are required" });
		}

        try {
            const storedCodeData = verificationCodes.get(codeId)

			if (!storedCodeData) {
				return res.status(400).json({ message: "Invalid or expired verification code" });
			}

            const { email: storedEmail } = storedCodeData

            // if (parseInt(code, 10) !== storedCode) {
            // 	return res.status(400).json({ error: "Invalid verification code" });
            // }

            const user = await User.findByEmail(storedEmail)

			if (!user) {
				return res.status(400).json({ message: "Email doesn't exist" });
			}

            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10)

            // Update the user's password in the database
            await User.updatePassword(user.id, hashedPassword)

            // Verification successful, delete the code from the map
            verificationCodes.delete(codeId)

            res.status(200).json({ message: 'Password reset successfully' })
        } catch (error) {
            console.error('Error verifying code:', error)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    // static async verifyCode(req, res) {
    //     const { codeId, code } = req.body;

    //     const storedCodeData = verificationCodes.get(codeId);

    //     if (!storedCodeData) {
    //         return res.status(400).json({ error: "Invalid or expired verification code" });
    //     }

    //     const { email, code: storedCode, expiresAt } = storedCodeData;

    //     if (Date.now() > expiresAt) {
    //         verificationCodes.delete(codeId);
    //         return res.status(400).json({ error: "Verification code expired" });
    //     }

    //     if (parseInt(code, 10) !== storedCode) {
    //         return res.status(400).json({ error: "Invalid verification code" });
    //     }

    //     // Verification successful
    //     verificationCodes.delete(codeId);
    //     res.status(200).json({ message: "Verification successful", email });
    // }

    static async loginUser(req, res) {
        const { email, password } = req.body

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: 'Email and password are required' })
        }

        try {
            const user = await User.findByEmail(email)

            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' })
            }

            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' })
            }
            if (!user.verified_account) {
                return res
                    .status(400)
                    .json({ message: 'Verify your email please' })
            }

            const token = jwt.sign(
                { email: user.email, id: user.id },
                SECRET_KEY,
                {
                    expiresIn: '2h',
                }
            )

            res.json({ message: 'Logged in successfully', token })
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' })
        }
    }

    static async loginGoogleUser(req, res) {
        const { given_name, family_name, email, provider, id } = req.user
        try {
            const existingUser = await User.findUserByProviderId(id)
            if (!existingUser) {
                await User.createGoogleAccount({
                    given_name,
                    family_name,
                    email,
                    provider,
                    id,
                })
            }

            const token = jwt.sign({ email: req.user.email }, SECRET_KEY, {
                expiresIn: '12h',
            })
            res.cookie('accessToken', token)
            res.redirect(process.env.FRONTEND_LOCAL_DEV + '/accueil')
            res.status(201)
        } catch (error) {
            // console.log(error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }
}

module.exports = AuthController
