const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("books.json");

class LowDbHelper {
    constructor() {
        this.db = lowdb(adapter);
    }
    getData() {
        try {
            let data = this.db.getState().books;
            return data;
        } catch (e) {
            console.log(e);
        }
    }
    saveData(arg) {
        try {
            this.db.set("books", arg).write();
            console.log("data was saved");
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = { LowDbHelper }

