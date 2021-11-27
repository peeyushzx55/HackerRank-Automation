// node hrauto.js --config=config.json --url="https://www.hackerrank.com"

let minimist = require('minimist');
let fs = require('fs');
let puppeteer = require('puppeteer');

let args = minimist(process.argv);
let configJSON = fs.readFileSync(args.config, 'utf-8');
let config = JSON.parse(configJSON);

async function run() {
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    let pages = await browser.pages();
    let page = pages[0];
    await page.goto(args.url);

    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']", config.username, {delay: 40});

    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']", config.password, {delay: 40});

    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']");

    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']");

    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']");

    await page.waitFor(3000);

    await page.waitForSelector("a[data-attr1='Last']");
    let numPages = await page.$eval("a[data-attr1='Last']", function (atag) {
        let np = parseInt(atag.getAttribute('data-page'));
        return np;
    })

    // move through all pages
    for (let i = 0; i < numPages; i++) {
        await handlePage(browser, page);
    }
}

async function handlePage(browser, page) {
    // do some code
    await page.waitForSelector("a.backbone.block-center");
    let curls = await page.$$eval("a.backbone.block-center", function (atags) {
        // let urls = [];

        // for (let i = 0; i < atags.length; i++) {
        //     let url = atags[i].getAttribute("href");
        //     urls.push(url);
        // }

        // let urls = atags.map(function(atag, i){
        //     return atag.getAttribute("href");
        // });

        // let urls = atags.map(atag => atag.getAttribute(href));
        // return urls;
        return atags.map(atag => atag.getAttribute("href"));
    });

    for (let i = 0; i < curls.length; i++) {
        await handleContest(browser, page, curls[i]);
    }

    // move to next page
    await page.waitFor(1500);
    await page.waitForSelector("a[data-attr1='Right']");
    await page.click("a[data-attr1='Right']");
}

async function handleContest(browser, page, curl) {
    let npage = await browser.newPage();
    await npage.goto(args.url + curl);
    await npage.waitFor(2000);

    await npage.waitForSelector("li[data-tab='moderators']");
    await npage.click("li[data-tab='moderators']");

    for (let i = 0; i < config.moderators.length; i++) {
        let moderator = config.moderators[i];

        await npage.waitForSelector("input#moderator");
        await npage.type("input#moderator", moderator, { delay: 50 });

        await npage.keyboard.press("Enter");
    }

    await npage.waitFor(1000);
    await npage.close();
    await page.waitFor(2000);

}

run();