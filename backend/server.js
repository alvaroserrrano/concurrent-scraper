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

//Check application is running
app.get("/", (req, res) => {
    console.log(os.hostname());
    let response = {
        msg: "hello world",
        hostname: os.hostname().toString()
    };
    res.send(response);
});

app.post("/api/books", async (req, res) => {
    req.setTimeout(timeout);
    try {
        let data = req.body;
        console.log(req.body.url);
        while (browsers == maxNumBrowsers) {
            await sleep(1000);
        }
        await getBooksHandler(data).then(result => {
            let response = {
                msg: "successfully fetched data",
                hostname: os.hostname(),
                books: result
            };
            console.log("done");
            res.send(response);
        });
    } catch (e) {
        res.send({ error: e.toString() });
    }
});

app.post("/api/booksDetails", async (req, res) => {
    req.setTimeout(timeout);
    try {
        let data = req.body;
        console.log(req.body.url);
        while (browsers == maxNumBrowsers) {
            await sleep(1000);
        }
        await getBookDetailsHandler(data).then(result => {
            let response = {
                msg: "retrieved book details",
                hostname: os.hostname(),
                url: req.body.url,
                booksDetails: result
            };
            console.log("done", response);
            res.send(response);
        });
    } catch (error) {
        res.send({ error: error.toString() });
    }
});

async function getBooksHandler(arg) {
    let pMng = require("./driver");
    let puppeteerManager = new pMng.Driver(arg);
    browsers += 1;
    try {
        let books = await puppeteerManager.getAllBooks().then(result => {
            return result;
        });
        browsers -= 1;
        return books;
    } catch (e) {
        browsers -= 1;
        console.log(e);
    }
}

async function getBookDetailsHandler(arg) {
    let pMng = require("./driver");
    let puppeteerManager = new pMng.Driver(arg);
    browsers += 1;
    try {
        let bookDetails = await puppeteerManager
            .getBookDetails()
            .then(result => {
                return result;
            });
        browsers -= 1;
        return bookDetails;
    } catch (e) {
        browsers -= 1;
        console.log(e);
    }
}

function sleep(ms) {
    console.log("running max number of browsers");
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(PORT);
console.log(`App running on port: ${PORT}`);
