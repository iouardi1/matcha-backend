const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
	const token =
		req.cookies?.accessToken ||
		req.header("Authorization")?.replace("Bearer ", "");

	if (token === "undefined") {
		return res.status(401).json({ message: "Access token is missing" });
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET,
			function (err, decoded) {
				if (err) return res.status(500).send({ auth: false, message: err });
				req.userId = decoded.id;
				next();
			},
		);
	} catch (error) {
		return res.status(401).json({ message: "Invalid access token" });
	}
};

module.exports = verifyToken;
