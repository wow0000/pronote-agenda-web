const express = require("express");
const router = express.Router();

const pronote = require("pronote-lib");

router.use(express.json());

router.post("/", function (req, res) {
	try {
		if (req.body === undefined) {
			res.json({"status": "error"});
			console.log("body unknown")
			return;
		}
	} catch (err) {
		res.json({"status": "error"});
		console.log("crashed",err)
		return;
	}
	pronote.fetch(req.body.username, req.body.password, req.body.url, req.body.cas).then(function (rep) {
		res.json(rep);
		return true;
	}).catch(function (err) {
		res.json(err);
		return true;
	})
});

module.exports = router;