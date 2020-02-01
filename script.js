const clockTime = document.querySelector(".clock-time");
const dateElement = document.querySelector(".date-container");
const timezoneName = document.querySelector(".timezone-name");
const timezoneReset = document.querySelector(".timezone-reset");
const mapElement = document.querySelector(".map-container");
const mapX = document.querySelector(".map-x");
const mapY = document.querySelector(".map-y");
let mapWidth = mapElement.offsetWidth;
let mapHeight = mapElement.offsetHeight;
let mapDisabled = false;

function update() {
    let now = moment();
    if (selectedTimezone) {
        now.tz(selectedTimezone.name);
    }
    let hours = now.hours();
    let minutes = now.minutes();
    let seconds = now.seconds();
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    clockTime.innerHTML = `${hours}:${minutes}:${seconds}`;

    dateElement.innerHTML = now.format("LLL");
}

setInterval(update, 1000);


const timezones = [];
const guess = moment.tz.guess();

let selectedTimezone;

function changeTimezone(timezone) {
    if (timezone === selectedTimezone) {
        return;
    }
    if (selectedTimezone) {
        selectedTimezone.deactivate();
    }
    timezone.activate();
    selectedTimezone = timezone;
    update();
}

class Timezone {
    constructor(mapElement, data) {
        this.name = data.name;
        this.x = (180 + data.long) / 360;
        this.y = (90 - data.lat) / 180;
        let span = document.createElement("span");
        span.style.left = this.x * 100 + "%";
        span.style.top = this.y * 100 + "%";
        mapElement.appendChild(span);
        this.element = span;
        if (this.name === guess) {
            changeTimezone(this);
        }
    }

    distSqr(x, y) {
        let dx = this.x - x;
        let dy = this.y - y;
        return dx * dx + dy * dy;
    }

    activate() {
        let m = moment().tz(this.name);
        timezoneName.innerText = this.name + " " + m.zoneAbbr();
        mapX.style.left = this.x * 100 + "%";
        mapY.style.top = this.y * 100 + "%";
    }

    deactivate() {
        this.element.classList.remove("active");
    }
}

fetch("/timezone-data.json").then(resp => resp.json()).then(data => {
    for (let name in data.zones) {
        timezones.push(new Timezone(mapElement, data.zones[name]));
    }
});

mapElement.addEventListener("mousemove", event => {
    if (mapDisabled) {
        return;
    }
    let rect = mapElement.getBoundingClientRect();
    let top = rect.top + document.body.scrollTop;
    let left = rect.left + document.body.scrollLeft;

    console.log(top, left, event.clientX - left, event.clientY - top);
    let x = event.clientX - left;
    let y = event.clientY - top;
    let px = x / mapWidth;
    let py = y / mapHeight;
    let closestDist = 100;
    let closestTimezone = false;

    for (let timezone of timezones) {
        let dist = timezone.distSqr(px, py);
        if (dist < closestDist) {
            closestTimezone = timezone;
            closestDist = dist;
        }
    }

    if (closestTimezone) {
        changeTimezone(closestTimezone);
    }
});

mapElement.addEventListener("click", event => {
    mapDisabled = true;
    mapElement.style.opacity = 0.7;
});


mapElement.addEventListener("mouseleave", event => {
    mapDisabled = false;
    mapElement.style.opacity = 1;
});


timezoneReset.addEventListener("click", () => {
    for (let timezone of timezones) {
        if (timezone.name === guess) {
            changeTimezone(timezone);
            return;
        }
    }
});