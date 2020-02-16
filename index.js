const express = require("express");
const app = express();

const api = require("./lib/pronote.js");
app.set("Service-Worker-Allowed", "/")

app.use("/api/", api);
app.use(express.static('./web/'));

app.listen(4648, function () {
	console.log('App listening on port 4648!')
});