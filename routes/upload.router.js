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
	let slash;
	const path1 = __dirname;
	const newPath = path1.replace(/\\routes|\/routes/g, '');
	newPath.indexOf('\\') !== -1 ? slash = '\\' : slash = '/'
	const newPath1 = `${newPath}${slash}uploads${slash}${req.file.filename}`;
  	res.json({ url: newPath1 });
});

router.get("/", (req, res) => {
	const absolutePath = req.query.path;

    // Ensure the path is within a specific root directory for security
    const uploadsDirectory = path.resolve(__dirname, '../uploads');

    // Prevent serving files outside of the intended directory
    if (!absolutePath.startsWith(uploadsDirectory)) {
        return res.status(400).json({ error: "Invalid path" });
    }
	
    // Send the file if the path is valid and absolute
    res.sendFile(absolutePath, { root: '' }, (err) => {
		if (err) {
            console.error("Error sending the file:", err);
            res.status(404).json({ error: "Image not found" });
        }
    });
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
