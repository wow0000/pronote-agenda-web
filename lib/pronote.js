const express = require("express");
const router = express.Router();

const pronote = require("pronote-lib");

router.use(express.json());

router.post("/", function (req, res) {
	pronote.fetch(req.body.username, req.body.password, req.body.url, req.body.cas).then(function (rep) {
		res.json(rep);
	})
});

module.exports = router;