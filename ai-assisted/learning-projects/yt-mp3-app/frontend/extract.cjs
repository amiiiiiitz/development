const fs = require("fs");
const path = require("path");
const jsPath = path.join(process.cwd(), "dist", "assets", "index-C2KmSVW6.js");
const js = fs.readFileSync(jsPath, "utf8");
// Find Qf definition
let idx = js.indexOf("function Qf(");
console.log("function Qf at:", idx);
if (idx >= 0) console.log(js.slice(idx, idx + 200).replace(/\n/g, " "));
// Find Zs
let idx2 = js.indexOf("Zs=");
console.log("Zs= at:", idx2);
if (idx2 >= 0) console.log(js.slice(Math.max(0, idx2 - 30), idx2 + 120).replace(/\n/g, " "));
// Check what fa returns - look at Qf more
let idx3 = js.indexOf("Qf=");
console.log("Qf= at:", idx3);
if (idx3 >= 0) console.log(js.slice(Math.max(0, idx3 - 30), idx3 + 120).replace(/\n/g, " "));
