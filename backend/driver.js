//Puppeteer manager that creates and manages a browser instance
class Driver {
    constructor(args) {
        this.url = args.url;
        this.existingCommands = args.commands;
        this.numPages = args.numPages;
        this.allBooks = [];
        this.bookDetails = {};
    }

    async runPuppeteer() {
        const puppeteer = require("puppeteer");
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-gpu"]
        });
        let timeout = 6000;
        let commandIndex = 0;
        let commands = [];
        if (this.numPages > 1) {
            for (let i = 0; i < this.nrOfPages; i++) {
                if (i < this.nrOfPages - 1) {
                    commands.push(...this.existingCommands);
                } else {
                    commands.push(this.existingCommands[0]);
                }
            }
        } else {
            commands = this.existingCommands;
        }
        console.log("commands length", commands.length);
        let page = await browser.newPage();
        await page.setRequestInterception(true);
        //prevents images from loading to reduce time loading the site
        page.on("request", req => {
            if (["image"].indexOf(req.resourceType()) != -1) {
                req.abort();
            } else {
                req.continue();
            }
        });
        //intercept attempt to display message in the browser
        await page.on("console", msg => {
            for (let i = 0; i < msg._args.length; i++) {
                msg._args[i].jsonValue().then(res => {
                    console.log(res);
                });
            }
        });
        //navigate to URL
        await page.goto(this.url);
        while (commandIndex < commands.length) {
            try {
                console.log(`command ${commandIndex + 1}/${commands.length}`);
                //Create an array of all frames in the page
                let frames = page.frames();
                await frames[0].waitForSelector(
                    commands[commandIndex].locatorCss,
                    { timeout: timeout }
                );
                await this.executeCommand(frames[0], commands[commandIndex]);
                await this.sleep(1000);
            } catch (e) {
                console.log(e);
                break;
            }
            commandIndex++;
        }
        console.log("Done");
        browser.close();
    }

    async executeCommand(frame, command) {
        await console.log(command.type, command.locatorCss);
        switch (command.type) {
            case "click":
                try {
                    await frame.$eval(command.locatorCss, element =>
                        element.click()
                    );
                    return true;
                } catch (error) {
                    console.log("error", error);
                    return false;
                }

            case "getItems":
                try {
                    let books = await frame
                        .evaluate(command => {
                            function wordToNum(word) {
                                let num = 0;
                                let words = [
                                    "zero",
                                    "one",
                                    "two",
                                    "three",
                                    "four",
                                    "five"
                                ];
                                for (let n = 0; n < words.length; n++) {
                                    if (word == words[n]) {
                                        num = n;
                                        break;
                                    }
                                }
                                return num;
                            }
                            try {
                                let parsedItems = [];
                                let items = document.querySelectorAll(
                                    command.locatorCss
                                );
                                items.forEach(item => {
                                    let link =
                                        "https://books.toscrape.com/catalogue/" +
                                        item
                                            .querySelector(
                                                "div.image_container a"
                                            )
                                            .getAttribute("href")
                                            .replace("catalogue", "");
                                    let title = item
                                        .querySelector("h3 a")
                                        .getAttribute("title");
                                    let rating = item
                                        .querySelector("p.star-rating")
                                        .getAttribute("class")
                                        .replace("star-rating", "")
                                        .toLowerCase()
                                        .trim();
                                    let price = item
                                        .querySelect("p.price_color")
                                        .innerText.replace("£", "")
                                        .trim();
                                    let book = {
                                        title: title,
                                        rating: wordToNum(rating),
                                        price: parseInt(price),
                                        url: link
                                    };
                                    parsedItems.push(book);
                                });
                                return parsedItems;
                            } catch (e) {
                                console.log(e);
                            }
                        }, command)
                        .then(res => {
                            this.allBooks.push.apply(this.allBooks, res);
                            console.log(
                                "All books length ",
                                this.allBooks.length
                            );
                        });
                } catch (e) {
                    console.log(e);
                    return false;
                }

            case "getItemDetails":
                try {
                    this.bookDetails = JSON.parse(
                        JSON.stringify(
                            await frame.evaluate(command => {
                                let item = document.querySelector(
                                    command.locatorCss
                                );
                                let description = item
                                    .querySelector(
                                        ".product_page > p:nth-child(3)"
                                    )
                                    .innerText.trim();
                                let upc = item
                                    .querySelector(
                                        ".table > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2)"
                                    )
                                    .innerText.trim();
                                let numReviews = item
                                    .querySelector(
                                        ".table > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(2)"
                                    )
                                    .innerText.trim();
                                let availability = item
                                    .querySelector(
                                        ".table > tbody:nth-child(1) > tr:nth-child(6) > td:nth-child(2)"
                                    )
                                    .innerText.replace("In stock (", "")
                                    .replace(" available)", "");
                                let details = {
                                    description: description,
                                    upc: upc,
                                    nrOfReviews: parseInt(nrOfReviews),
                                    availability: parseInt(availability)
                                };
                                return details;
                            }, command)
                        )
                    );
                    console.log(this.bookDetails);
                    return true;
                } catch (e) {
                    console.log(e);
                    return false;
                }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getAllBooks() {
        await this.runPuppeteer();
        return this.allBooks;
    }
    async getBookDetails() {
        await this.runPuppeteer();
        return this.bookDetails;
    }
}

module.exports = { Driver };
