let pronote_data;
let settings;

//load settings
if (localStorage.getItem("settings") !== null) {
    settings = localStorage.getItem("settings");
} else {
    settings = {
        color: true,
        server: location.origin + location.pathname + "/api/",
    };
    localStorage.setItem("settings", JSON.stringify(settings));
}


// PWA Install
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.prompt();
});


window["main-date"].onchange = function () {
    pushCourses(window["main-date"].value, JSON.parse(localStorage.getItem("data")))
}

window["colorCheck"].onchange = function () {
    settings.color = window["colorCheck"].checked();
    localStorage.setItem("settings", JSON.stringify(settings));
}

window["ServerURLInput"].onchange = function () {
    settings.server = window["serverURLInput"].value();
    localStorage.setItem("settings", JSON.stringify(settings));
}

let table = document.querySelector("#TimeTable tbody");

$('#date-picker').datepicker({
    todayBtn: true,
    language: "fr"
});

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

    coursCell.style.backgroundColor = cours.color;
    //coursCell.style["mix-blend-mode"] = "hard-light";
    //coursCell.style.text = "#FFFFF;";
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
    resetTable();
    let timeTableForWeek;
    time = new Date(time);
    let i = 0;
    for (i; i < data.timetable.length; i++) { //Using a for loop for optimisations + break;
        let e = data.timetable[i];
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
    timeTableForWeek["content"].forEach(function (e) {
        if (e.from >= dayFrom && e.to <= dayTo) {
            coursesOfDay.push(e);
        }
    });
    insert_cours(coursesOfDay);
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
    let divs = ["div-main", "div-login", "div-settings"];
    divs.forEach(function (e) {
        window[e].hidden = (e !== div_name);
    });
    console.log("wrapped to ", div_name);
}

function try_login() {
    let info = document.getElementById("login-info");

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let academie = document.getElementById("academie").selectedOptions[0].innerText;
    let pronoteurl = document.getElementById("pronoteurl").value;

    UI_spinner(true);

    let sendData = {
        type: "fetch",
        username,
        password,
        url: pronoteurl,
        cas: academie
    };
    sendData = JSON.stringify(sendData);
    fetch(settings.server, {
        method: "POST", body: sendData, mode: "cors", headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    }).then(function (response) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function (json) {
                console.log(json);
                if (json.name !== undefined) {
                    localStorage.setItem("username", username);
                    localStorage.setItem("password", password);
                    localStorage.setItem("academie", academie);
                    localStorage.setItem("pronoteurl", pronoteurl);

                    localStorage.setItem("data", JSON.stringify(json));
                    UI_login(true);
                } else {
                    UI_spinner(false);
                    info.innerText = "Mauvais identifiants.";
                    info.hidden = false;
                }
            });
        } else {
            UI_spinner(false);
            info.innerText = "Erreur de réponse au serveur d'authentification.";
            info.hidden = false;
            console.log(contentType);
            console.error("NO JSON FOUND WALLAH");
        }
    }).catch(function (err) {
        console.error("Erreur:", err);
        info.innerText = "Erreur de connexion au serveur d'authentification, vérifiez votre connexion internet.";
        info.hidden = false;
        UI_spinner(false);
    });

}

//init

function redirect() {
    if (localStorage.getItem("username") === null) {
        //Need to show Login page
        UI_login(false);

    } else {
        //Load data;
        pronote_data = JSON.parse(localStorage.getItem("pronote_data"));
    }
}

redirect();