const jwt = require("jsonwebtoken");
const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.JWT_SECRET;

class AuthController {
	static async registerUser(req, res) {
		const { firstname, lastname, username, email, password } = req.body;

		if (!firstname || !lastname || !username || !email || !password) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		try {
			const newUser = await User.create({
				firstname,
				lastname,
				username,
				email,
				password: hashedPassword,
			});
			res
				.status(201)
				.json({ message: "User registered successfully", newUser });
		} catch (error) {
			if (error.code === "23505" && error.constraint === "unique_email") {
				return res.status(400).json({ statusText: "Email already exists" });
			}
			return res.status(500).json({ error: "Internal Server Error" });
		}
	}

	static async loginUser(req, res) {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		try {
			const user = await User.findByEmail(email);

			if (!user) {
				return res.status(400).json({ error: "Invalid credentials" });
			}

			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return res.status(400).json({ error: "Invalid credentials" });
			}

			const token = jwt.sign({ email: user.email }, SECRET_KEY, {
				expiresIn: "1h",
			});

			res.json({ message: "Logged in successfully", token });
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error" });
		}
	}

	static async loginGoogleUser(req, res) {
		const { given_name, family_name, email, provider, id } = req.user;
		try {
			await User.createGoogleAccount({
				given_name,
				family_name,
				email,
				provider,
				id,
			});
			console.log(req.user.email);
			const token = jwt.sign({ email: req.user.email }, SECRET_KEY, {
				expiresIn: "1h",
			});
			res.cookie("accessToken", token);
			res.redirect(process.env.FRONTEND_LOCAL_DEV + "/profile");
			res.status(201);
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error" });
		}
	}
}

module.exports = AuthController;
