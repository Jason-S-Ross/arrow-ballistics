import { Arrow, State, Rate, Point, Position, Velocity, Record  } from "./calc";
import { Plot } from "./plot";
import { Control } from "./controls";

var arrow = new Arrow (
    0.065,
    0.030,
    0.012,
    0.30,
    20 / 10000,
    1.86,
    0.4,
);
console.log(arrow);
var y0 = new State(
    new Position(0, 2),
    55,
    Math.PI * 45 / 180,
    0,
    0,
);
var dt = 0.001;
var records: Record[] = [];
var plot = new Plot("#graph", (rec) => rec.position.x, (rec) => rec.position.y);
// var angle_plot = new Plot("#angle", (rec) => rec.position.x, (rec) => 180 * rec.psi / Math.PI);

const controls_node = document.getElementById("controls");

var controls: Control[] = [
    new Control((v) => {y0.v = v;}, "speed", "Initial Speed (m/2)", 0, 100, y0.v, 1, document),
    new Control((v) => {y0.theta = v;}, "launch_angle", "Initial Angle (deg)", 0, 90, y0.theta,  Math.PI / 180, document),
    new Control((v) => {y0.psi = v;}, "angle_of_attack", "Angle of Attack (deg)", -10, 10, y0.psi, Math.PI / 180, document),
    new Control((v) => {y0.position.y = v;}, "launch_height", "Launch Height (m)", 0, 10, y0.position.y, 1, document),
    new Control((v) => {arrow.mass = v;}, "mass", "Total Mass (g)", 0, 2000, arrow.mass, 0.001, document),
    new Control((v) => {arrow.headMass = v;}, "headMass", "Head Mass (g)", 0, 1000, arrow.headMass, 0.001, document),
    new Control((v) => {arrow.length = v;}, "length", "Length (cm)", 0, 200, arrow.length, 0.01, document),
    new Control((v) => {arrow.fletchingArea = v;}, "fletchingArea", "Fletching Area (cm^2)", 0, 1000, arrow.fletchingArea, 0.0001, document),
    new Control((v) => {arrow.c_d = v;}, "c_d", "Coefficient of Drag", 0, 5, arrow.c_d, 1, document),
    new Control((v) => {arrow.c_l = v;}, "c_l", "Coefficient of Lift", 0, 2, arrow.c_l, 1, document),
    new Control((v) => {dt = v;}, "dt", "Time Delta", 0.0001, 0.1, dt, 1, document),
];
var table: HTMLTableElement = document.createElement("table");
var tBody = table.createTBody();
const maxColumns = 3;
var colNum = 0;
var tRow = tBody.insertRow();
for (var control of controls) {
    var tCell = tRow.insertCell();
    tCell.appendChild(control.node());
    control.control?.addEventListener("change", doit);
    ++colNum;
    if (colNum >= maxColumns) {
        tRow = tBody.insertRow();
        colNum = 0;
    }
}
controls_node?.appendChild(table);

var resultsTable: HTMLTableElement = document.createElement("table");

const maxloops = 100000;
const energyWidget = document.getElementById("energy");
const timeOfFlightWidget = document.getElementById("time_of_flight");
const momentumWidget = document.getElementById("momentum");
const distanceWidget = document.getElementById("total_distance");
function doit(): void {
    records = [];
    var y = y0;
    var t = 0;
    var loopcount = 0;
    while (y.position.y > 0) {
        records.push(
            {
                position: y.position,
                v: y.v,
                theta: y.theta,
                psi: y.psi,
                psi_dot: y.psi_dot,
                t: t
            }
        );
        y = arrow.step(y, dt);
        t += dt;
        if (loopcount > maxloops) {
            break;
        }
        loopcount++;
    }
    console.log(records);
    console.log(arrow);
    plot.plot(records);
    // angle_plot.plot(records);
    if (energyWidget) {
        energyWidget.innerText = (Math.pow(y.v, 2) * arrow.mass * 0.5).toFixed(2);
    }
    if (timeOfFlightWidget) {
        timeOfFlightWidget.innerText = t.toFixed(2);
    }
    if (momentumWidget) {
        momentumWidget.innerText = (y.v * arrow.mass).toFixed(2);
    }
    if (distanceWidget) {
        distanceWidget.innerText = y.position.x.toFixed(2);
    }
}

doit();
