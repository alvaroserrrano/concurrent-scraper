let axios = require('axios')
let ldb = require('./lowdbHelper.js').LowDbHelper
let ldbHelper = new ldb()
let allBooks = ldbHelper.getData()

let server = "http://your_load_balancer_external_ip_address"
let podsWorkDone = []
let booksDetails = []
let errors = []

function main() {
  let execute = process.argv[2] ? process.argv[2] : 0
  execute = parseInt(execute)
  switch (execute) {
    case 0:
      getBooks()
      break;
    case 1:
      getBooksDetails()
      break;
  }
}

function getBooks() {
  console.log('getting books')
  let data = {
    url: 'http://books.toscrape.com/index.html',
    nrOfPages: 20,
    commands: [
      {
        description: 'get items metadata',
        locatorCss: '.product_pod',
        type: "getItems"
      },
      {
        description: 'go to next page',
        locatorCss: '.next > a:nth-child(1)',
        type: "Click"
      }
    ],
  }
  let begin = Date.now();
  axios.post(`${server}/api/books`, data).then(result => {
    let end = Date.now();
    let timeSpent = (end - begin) / 1000 + "secs";
    console.log(`took ${timeSpent} to retrieve ${result.data.books.length} books`)
    ldbHelper.saveData(result.data.books)
  })
}

function getBooksDetails() {
  let begin = Date.now()
  for (let j = 0; j < allBooks.length; j++) {
    let data = {
      url: allBooks[j].url,
      nrOfPages: 1,
      commands: [
        {
          description: 'get item details',
          locatorCss: 'article.product_page',
          type: "getItemDetails"
        }
      ]
    }
    sendRequest(data, function (result) {
      parseResult(result, begin)
    })
  }
}

async function sendRequest(payload, cb) {
  let book = payload
  try {
    await axios.post(`${server}/api/booksDetails`, book).then(response => {
      if (Object.keys(response.data).includes('error')) {
        let res = {
          url: book.url,
          error: response.data.error
        }
        cb(res)
      } else {
        cb(response.data)
      }
    })
  } catch (error) {
    console.log(error)
    let res = {
      url: book.url,
      error: error
    }
    cb({ res })
  }
}

function parseResult(result, begin){
  try {
    let end = Date.now()
    let timeSpent = (end - begin) / 1000 + "secs ";
    if (!Object.keys(result).includes("error")) {
      let wasSuccessful = Object.keys(result.booksDetails).length > 0 ? true : false
      if (wasSuccessful) {
        let podID = result.hostname
        let podsIDs = podsWorkDone.length > 0 ? podsWorkDone.map(pod => { return Object.keys(pod)[0]}) : []
        if (!podsIDs.includes(podID)) {
          let podWork = {}
          podWork[podID] = 1
          podsWorkDone.push(podWork)
        } else {
          for (let pwd = 0; pwd < podsWorkDone.length; pwd++) {
            if (Object.keys(podsWorkDone[pwd]).includes(podID)) {
              podsWorkDone[pwd][podID] += 1
              break
            }
          }
        }
        booksDetails.push(result)
      } else {
        errors.push(result)
      }
    } else {
      errors.push(result)
    }
    console.log('podsWorkDone', podsWorkDone, ', retrieved ' + booksDetails.length + " books, ",
      "took " + timeSpent + ", ", "used " + podsWorkDone.length + " pods,", " errors: " + errors.length)
    saveBookDetails()
  } catch (error) {
    console.log(error)
  }
}

function saveBookDetails() {
  let books = ldbHelper.getData()
  for (let b = 0; b < books.length; b++) {
    for (let d = 0; d < booksDetails.length; d++) {
      let item = booksDetails[d]
      if (books[b].url === item.url) {
        books[b].booksDetails = item.booksDetails
        break
      }
    }
  }
  ldbHelper.saveData(books)
}

main()
