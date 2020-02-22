const express = require("express");
const router = express.Router();
const https = require('https')
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
		console.log("crashed", err)
		return;
	}
	pronote.fetch(req.body.username, req.body.password, req.body.url, req.body.cas).then(function (rep) {
		res.json(rep);
		return true;
	}).catch(function (err) {
		res.send(err);
		return true;
	})
});

router.post("/geo", function (req, res) {
	const data = `data={"nomFonction":"geoLoc","lat":${req.body.lat.toString()},"long":${req.body.long.toString()}}`
	const options = {
		hostname: "www.index-education.com",
		port: 443,
		path: "/swie/geoloc.php",
		method: "POST",
		headers: {
			'Content-Type': "application/x-www-form-urlencoded;charset=UTF-8",
			'User-Agent': "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1",
			'Content-Length': data.length
		}
	}

	let incomingData = "";
	const request = https.request(options, function (resp) {
		resp.on('data', function (data) {
			incomingData += data;
		});
		resp.on("end", function () {
			res.json((incomingData));
			return;
		})
	})

	request.write(data);
	request.end();

	request.on('error', (error) => {
		console.error(error)
		res.json(JSON.stringify({error: error}));
	})
})

module.exports = router;