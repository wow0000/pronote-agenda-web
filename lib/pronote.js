const express = require("express");
const router = express.Router();
const pronote = require("pronote-lib");

const supported_requests = {
	"homework": "get_homework",
	"absences": "get_absences",
	"reports": "get_reports",
	"timeplan": "get_timeplan",
	"marks": "get_marks",
	"profile_pic": "get_profile_pic",
	"menu": "get_menu",
	"information": "get_information",
	"student": "get_student"
}

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

router.post("/select", function (req, res) {
	let args = req.body;
	let request = {};
	if (typeof args.req === "array") return res.json({});

	args.req = [...new Set(args.req)];
	try {
		let user = new pronote.User({
			username: args.username,
			password: args.password,
			url: args.url,
			cas: args.cas
		}, async function () {
			for (let i = 0; i < args.req.length; i++) {
				let e = args.req[i];
				try {
					console.log(e);
					if (supported_requests[e] === undefined) return;
					request[e] = {status: true, update: new Date()}
					await user[supported_requests[e]]().then(function (res) {
						request[e].res = res;
					}).catch(console.error);
				} catch (err) {
					request[e] = {status: false}
					console.error(err);
				}
			}
			await res.json(request);
		})
	} catch (err) {
		res.json({});
	}
});

router.post("/geo", function (req, res) {
	pronote.geo(req.body.lat, req.body.long).then(function (resp) {
		res.json(resp);
	}).catch(function (err) {
		console.error(err)
		res.json({error: err})
	})
})

module.exports = router;