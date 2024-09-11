const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
	const token =
		req.cookies?.accessToken ||
		req.header("Authorization")?.replace("Bearer ", "");

	if (token === "undefined") {
		return res.status(401).json({message: "Access token is missing" });
		// return res.status(401).json({ shouldRedirect: true, redirectTo: "/auth/login", message: "Access token is missing" });
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET,
			function (err, decoded) {
				if (err) return res.status(401).send({shouldRedirect: true, redirectTo: "/auth/login", auth: false, message: err });
				req.email = decoded.email;
				next();
			},
		);
	} catch (error) {
		return res.status(401).json({message: "Access token is missing" });
		// return res.status(401).json({ shouldRedirect: true, redirectTo: "/auth/login", message: "Access token is missing" });
	}
};

module.exports = verifyToken;
