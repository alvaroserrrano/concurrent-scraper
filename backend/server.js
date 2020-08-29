const express = require("express");
const bodyParser = require("body-parser");
const os = require("os");

const PORT = 5000;
const app = express();
let timeout = 150000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let browsers = 0;
//retrieve data from 5 pages simultaneously
let maxNumBrowsers = 5;

