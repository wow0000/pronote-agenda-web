/* eslint-disable no-unused-vars */
let settings;
let table = document.querySelector("#TimeTable tbody");
let translated_data = {
	timeplan: "Emploi du temps",
	absences: "Absences",
	marks: "Notes",
	homework: "Devoirs",
	profile_pic: "Photo de profil",
	menu: "Menu",
	information: "Informations",
	student: "Profil"
}
let data_to_retrieve = ["timeplan", "absences", "marks", "homework", "profile_pic", "menu", "information", "student"];
let globalI = 0;

function save_settings() {
	localStorage.setItem("settings", JSON.stringify(settings));
}

function fnc_settings() {
//load settings
	if (localStorage.getItem("settings") !== null) {
		settings = JSON.parse(localStorage.getItem("settings"));
	} else {
		settings = {
			color: true,
			nativeDate: false, //This setting is reversed.
			server: location.origin + location.pathname + "api/",
			checklist: data_to_retrieve,
		};
		save_settings();
	}
//Apply settings.
	document.getElementById("colorCheck").checked = settings.color;
	document.getElementById("native-Check").checked = !settings.nativeDate;
	document.getElementById("ServerURLInput").value = settings.server;

	document.getElementById("main-date").onchange = function () {
		pushCourses(window["main-date"].value, JSON.parse(localStorage.getItem("section_timeplan")));
	}

	document.getElementById("colorCheck").onchange = function () {
		settings.color = window["colorCheck"].checked;
		save_settings();
	}

	document.getElementById("native-Check").onchange = function () {
		settings.nativeDate = !window["native-Check"].checked;
		save_settings();
	}

	document.getElementById("ServerURLInput").onchange = function () {
		settings.server = window["ServerURLInput"].value;
		save_settings();
	}

	document.getElementById("refresh-button").onclick = function () {
		settings.checklist = retrieve_checkbox();
		save_settings();

		refreshData(settings.checklist);

	}
}

function create_checkbox(label, data) {
	globalI++;
	let template = document.getElementById("template-checkbox");
	let checklist = document.getElementById("copy_template");

	let clone = document.importNode(template.content, true);
	clone.querySelector(".template-checkbox-input").id = "id_" + globalI;
	clone.querySelector(".template-checkbox-label").for = "id_" + globalI;
	clone.querySelector(".template-checkbox-label").innerHTML = label;
	clone.querySelector(".template-checkbox-input").setAttribute("data", data);

	checklist.appendChild(clone);
}

function create_checkboxes() {
	for (let i = 0; i < data_to_retrieve.length; i++) {
		let d = data_to_retrieve[i]
		create_checkbox(translated_data[d], d);
	}
}

function retrieve_checkbox() {
	let checklists = document.getElementById("copy_template").getElementsByClassName("template-checkbox-input");
	let result = [];
	for (let i = 0; i < checklists.length; i++) {
		if (checklists[i].checked) {
			result.push(checklists[i].getAttribute("data"));
		}
	}
	return result;
}

function restore_checkbox() {
	let checklists = document.getElementById("copy_template").getElementsByClassName("template-checkbox-input");
	let to_check = settings.checklist;
	for (let i = 0; i < checklists.length; i++) {
		let d = checklists[i].getAttribute("data");
		if (to_check.includes(d)) {
			checklists[i].checked = true;
		}
	}
}

fnc_settings();
create_checkboxes();
restore_checkbox();
//Auto pronote completion URL
if (getUrlVars()["pronoteurl"] !== undefined) {
	console.log("Applying PronoteURL");
	document.getElementById("pronoteurl").value = getUrlVars()["pronoteurl"].replace("#", "");
}


//Geo localisation part
if ("geolocation" in navigator) {
	document.getElementById("geo_localisation").hidden = false;
	window["refreshGeo"] = function () {
		let pronote_url = document.getElementById("pronoteurl");
		pronote_url.hidden = true;

		navigator.geolocation.getCurrentPosition(function (position) {
			let info = document.getElementById("login-info");
			let sendData = {
				lat: position.coords.latitude,
				long: position.coords.longitude
			};

			sendData = JSON.stringify(sendData);

			fetch(settings.server + "geo", {
				method: "POST", body: sendData, mode: "cors", headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}).then(function (response) {
				const contentType = response.headers.get("content-type");
				if (contentType && contentType.indexOf("application/json") !== -1) {
					return response.json().then(function (json) {
						pronote_url.outerHTML = '<select class="form-control" id="pronoteurl"></select>' //XSS, always hardcode
						let pronote_select = document.getElementById("pronoteurl");
						json.forEach(function (e) {
							let opt = document.createElement("option");
							opt.value = e.url;
							opt.text = e.nomEtab;
							pronote_select.add(opt);
						})
					});
				} else {
					info.hidden = false;
					info.innerText = "Erreur de la part du serveur";
					console.error(contentType);
				}
			}).catch(function (err) {
				info.hidden = false;
				info.innerText = "Erreur de connexion au serveur, vérifiez votre connexion internet";
				console.error(err);
			});
		});
	}
}

function resetSW() {
	'use strict';
	navigator.serviceWorker.getRegistrations().then(function (registrations) {
		for (let registration of registrations) {
			registration.unregister().then(function (err) {
				console.log("Service worker: ", err);
			});
		}
	})
	location.reload();
}

function refreshData(data) {
	console.log("one")
	let info = document.getElementById("settings-info");

	function refreshError(msg) {
		info.innerText = msg;
		info.hidden = false;
		document.getElementById("settings-update-spinner").hidden = true;

	}

	document.getElementById("settings-update-spinner").hidden = false;

	let sendData = {
		username: localStorage.getItem("username"),
		password: localStorage.getItem("password"),
		url: localStorage.getItem("pronoteurl"),
		cas: localStorage.getItem("academie")
	};
	/**
	fetch(settings.server, {
		method: "POST", body: sendData, mode: "cors", headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	}).then(function (response) {
		const contentType = response.headers.get("content-type");
		if (contentType && contentType.indexOf("application/json") !== -1) {
			return response.json().then(function (json) {
				console.log(json);
				if (json.name !== undefined) {
					info.hidden = true;
					localStorage.setItem("data", JSON.stringify(json));
					localStorage.setItem("updateTime", new Date().toJSON())
					document.getElementById("settings-update-spinner").hidden = true;
					redirect();
				} else {
					refreshError("Mauvais identifiants.", "bad login");
				}
			});
		} else {
			refreshError("Erreur de connexion au serveur d'authentification.", contentType);
		}
	}).catch(function (err) {
		refreshError("Erreur de connexion au serveur d'authentification, vérifiez votre connexion internet.", err);
	});
	 **/
	retrieve_data(sendData, data, false).then(function (res) {
		if (res !== undefined) {
			info.hidden = true;
			document.getElementById("settings-update-spinner").hidden = true;
			let keys = Object.keys(res);
			for (let i = 0; i < keys.length; i++) {
				if (res[keys[i]].status === false) {
					console.log("Error on ", keys[i])
				} else
					localStorage.setItem("section_" + keys[i], JSON.stringify(res[keys[i]]));
			}
			redirect();
		} else {
			refreshError("La réponse est vide.");
		}

	}).catch(function (e) {
		refreshError(e)
	})
}


/**
 * @return {object} arguments
 */
function getUrlVars() {
	let vars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
		vars[key] = value;
	});
	return vars;
}

/**
 * insert_line
 * @param {number} time - Unix Timestamp in ms
 * @param {object} cours
 * @return {object} newLine
 */

function insert_line(time, cours) {
	let newLine = table.insertRow();
	let timeCell = newLine.insertCell(0);
	let coursCell = newLine.insertCell(1);
	let salleCell = newLine.insertCell(2);

	let date = new Date(time);
	let minutes = date.getMinutes().toString();
	if (minutes.length < 2) {
		minutes = "0" + minutes;
	}

	if (cours.room === undefined) {
		cours.room = "?"
	}
	if (cours.away || cours.cancelled) {
		timeCell.style.backgroundColor = "#e74c3c";
	}
	timeCell.innerText = `${date.getHours()}:${minutes}`; //8:00
	coursCell.innerText = cours.subject;
	salleCell.innerText = cours.room;
	if (settings.color)
		coursCell.style.backgroundColor = cours.color;
	return newLine;
}

/**
 * insert_cours()
 * @param {array} cours
 */
function insert_cours(cours) {
	cours.forEach(function (cour) {
		insert_line(cour.from, cour);
	})
}

/**
 * resetTable() delete everything in TimeTable
 */
function resetTable() {
	let childes = table.children;
	while (childes.length !== 0) {
		childes[0].remove();
	}
}

/**
 * https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
 * @name Date#getWeekNumber
 * @function
 * @return {number}
 */

Date.prototype.getWeekNumber = function () {
	const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
};

function pushCourses(time, data) {
	//Show outdated popup if data isn't updated for more than 5 days
	document.getElementById("main-outdated").hidden = !Boolean(new Date(data.date)) < new Date().fp_incr("-5d");
	data = data.res;
	resetTable();
	let timeTableForWeek;
	time = new Date(time);
	let i = 0;
	for (i; i < data.length; i++) { //Using a for loop for optimisations + break;
		let e = data[i];
		if (new Date(e.time).getWeekNumber() === time.getWeekNumber()) {
			timeTableForWeek = e;
			break;
		}
	}
	//Need to get courses of the day.
	//Every date used MUST be in Local Time.
	let dayFrom = time.getTime();
	let dayTo = dayFrom + 24 * (36 * Math.pow(10, 5)); // Add 24h

	let coursesOfDay = [];
	if (timeTableForWeek === undefined) { //check if courses is loaded.
		insert_line(0, {subject: "Aucun cours chargé", room: "/", away: true, cancelled: true, color: "#e74c3c"});
	} else {
		timeTableForWeek["content"].forEach(function (e) {
			if (e.from >= dayFrom && e.to <= dayTo) {
				coursesOfDay.push(e);
			}
		});
		insert_cours(coursesOfDay);
	}
}

/**
 * @param {boolean} is_logged
 */
function UI_login(is_logged) {
	UI_wrap(is_logged ? "div-main" : "div-login");
}

/**
 * @param {boolean} is_spinning
 */
function UI_spinner(is_spinning) {
	document.getElementById("login-button").hidden = is_spinning;
	document.getElementById("login-spinner").hidden = !is_spinning;
}

function UI_wrap(div_name) {
	let divs = ["div-settings", "div-login", "div-main", "div-homework"];
	divs.forEach(function (e) {
		window[e].hidden = (e !== div_name);
	});
	console.log("wrapped to ", div_name);
}

function try_login() {
	let info = document.getElementById("login-info");

	let username = document.getElementById("username").value;
	let password = document.getElementById("password").value;
	let cas = document.getElementById("academie").selectedOptions[0].innerText;
	let url = document.getElementById("pronoteurl").value;

	if (url[url.length - 1] !== "/") {
		url += "/";
	}

	UI_spinner(true);
	retrieve_data({
		username,
		password,
		url,
		cas
	}, data_to_retrieve, true).then(function (res) {
		let keys = Object.keys(res);
		for (let i = 0; i < keys.length; i++) {
			localStorage.setItem("section_" + keys[i], JSON.stringify(res[keys[i]]));
		}
		redirect();
	}).catch(function (err) {
		info.innerText = err;
		info.hidden = false;
		UI_spinner(false);
	})
}

function retrieve_data({username, password, cas, url}, data, save_id) {
	return new Promise(function (resolve, reject) {
		let sendData = {
			username,
			password,
			url,
			cas,
			req: data
		};

		sendData = JSON.stringify(sendData);
		console.log(sendData);
		fetch(settings.server + "select", {
			method: "POST", body: sendData, mode: "cors", headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		}).then(function (response) {
			const contentType = response.headers.get("content-type");
			if (contentType && contentType.indexOf("application/json") !== -1) {
				return response.json().then(function (json) {
					console.log(json);
					if (json !== {}) {
						if (save_id) {
							localStorage.setItem("username", username);
							localStorage.setItem("password", password);
							localStorage.setItem("academie", cas);
							localStorage.setItem("pronoteurl", url);
						}

						localStorage.setItem("credentials_updateTime", new Date().toJSON())
						resolve(json);
					} else {
						reject("Mauvais identifiants.");
					}
				});
			} else {
				reject("Erreur de réponse au serveur d'authentification.");
				console.log(contentType);
				console.error("NO JSON FOUND WALLAH");
			}
		}).catch(function (err) {
			console.error("Erreur:", err);
			reject("Erreur de connexion au serveur d'authentification, vérifiez votre connexion internet.");
		});
	})
}

//2/19/2020
flatpickr("#main-date", {
	dateFormat: "m/d/Y",
	altInput: true,
	altFormat: "d/m/Y",
	disableMobile: settings.nativeDate.toString(),
	defaultDate: new Date(new Date().setHours(0, 0, 0, 0)),
});

function hide_element(hide) {
	let x = document.getElementsByClassName("logged-in");
	for (let i = 0; i < x.length; i++) {
		x[i].hidden = hide;
	}
}

//Homeworks

/**
 * @param {string} title
 * @param {string} given - DD/MM
 * @param {string} about
 * @param {string} color - #XXXXXX
 */
function push_Homework(title, given, about, color) {
	if (typeof color !== "string" || color.length > 7 || color[0] !== "#") throw "XSS attack color";

	let template = document.getElementById("template-subject");
	let homework = document.getElementById("div-work");

	let clone = document.importNode(template.content, true);
	clone.querySelector(".template-subject-name").innerText = title;
	clone.querySelector(".template-subject-given").innerText = `Pour le ${given}`;
	clone.querySelector(".template-subject-about").innerHTML = about;
	clone.querySelector(".empty_bloc").style.backgroundColor = color;

	homework.appendChild(clone);
}

function reset_Homework() {
	document.getElementById("div-work").innerHTML = "";
}

function refresh_Homework(data) {
	//Show outdated popup if data isn't updated for more than 2 days
	document.getElementById("homework-outdated").hidden = !Boolean(new Date(data.date)) < new Date().fp_incr("-2d");
	data = data.res;
	reset_Homework();

	for (let i = 0; i < data.length; i++) {
		let e = data[i]
		let to = new Date(e.until).toLocaleDateString();
		push_Homework(e.subject, to, e.rawContent, e.color);
	}
}

//init

function redirect() {
	if (localStorage.getItem("username") === null) {
		//Need to show Login page
		UI_login(false);
		hide_element(true);
	} else {
		//Load data;
		UI_login(true);

		pushCourses(new Date(new Date().setHours(0, 0, 0, 0)), JSON.parse(localStorage.getItem("section_timeplan")));
		refresh_Homework(JSON.parse(localStorage.getItem("section_homework")))

		document.getElementById("main-date").value = new Date(new Date().setHours(0, 0, 0, 0));
		hide_element(false);
	}
}

redirect();