const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
	destination: "./uploads/",
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname));
	},
});

const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
	const path1 = __dirname;
  const newPath = path1.replace('\\routes', '');
  res.json({ url: `${newPath}/uploads/${req.file.filename}` });
});

router.delete("/", (req, res) => {
	const { url } = req.body;
	const filePath = path.join(url);
	fs.unlink(filePath, (err) => {
		if (err) {
			return res
				.status(500)
				.json({ message: "File deletion failed", error: err.message });
		}
		res.status(200).json({ message: "File deleted successfully" });
	});
});

module.exports = router;
