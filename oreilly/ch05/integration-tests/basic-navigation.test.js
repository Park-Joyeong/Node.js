const portfinder = require('portfinder')
const puppeteer = require('puppeteer')

const app = require('../meadowlark.js')

let server = null
let port = null

beforeEach(async () => {
    port = await portfinder.getPortPromise()
    server = app.listen(port)
})

afterEach(() => {
    server.close()
})

test('home page links to about page', async () => {
    const browser = await puppeteer.launch()
    //TODO
    //const page = 
})