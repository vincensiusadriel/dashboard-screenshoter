const puppeteer = require('puppeteer');
const fs = require('fs');
const moment = require('moment')

const toTimestamp = (strDate) => {  
    

    if (strDate == null || strDate == "") return [null, null]

    const dt = moment(strDate).unix() * 1000;  
    if(isNaN(dt)) {
        return [null, "Cannot Convert Timestamp"]
    }
    return [dt, null];  
    
  }  
  


(async() => {

    
    let raw = fs.readFileSync('config.json')
    let config = JSON.parse(raw)

    let [begin, err1] = toTimestamp(config.beginTimestamp)
    if (err1 != null) {
        console.log(err1)
        process.exit(0)
    }

    let [end, err2] = toTimestamp(config.endTimestamp)
    if (err2 != null) {
        console.log(err2)
        process.exit(0)
    }

    const browser = await puppeteer.connect({
        browserWSEndpoint: config.wsEndPoint
    });
    
    let links = config.links

    let arr = []

    if (config.specific == '' || config.specific == null) {
        for(let key in links) {
            // arr.push(
                 await generate(browser, config, links, key, begin, end)
            // )
        }
    } else {
        if(config.specific in links) {
            await generate(browser, config, links, config.specific)
        } else {
            console.log("Key is not in links")
        }
    }
    

    // await Promise.all(arr)
    process.exit(0) 

})()

function wait (ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }

  const getClip = (element) => {
    const { height, width, x, y } = element.getBoundingClientRect();
    return { height, width, x, y };
};


const generate = async (browser, config, links, key, begin, end) => {
    const page = await browser.newPage();
    let url = links[key].link;
    const selectorOptions = {
        timeout: 120000,
        visible: true,
    };

    if(begin != null && end != null && (links[key].timestampParams != null && links[key].timestampParams != "")) {
        let timestampParams = links[key].timestampParams
        timestampParams = timestampParams.replace('{beginTimestamp}', begin).replace('{endTimestamp}', end)
        let arrStr = url.split("?")
        url = arrStr[0] + "?" + timestampParams
    }

    await page.setViewport({
        height: 9000,
        width: 5000,
    })

    await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 120000
    });

    await page.waitForSelector(links[key].selector, selectorOptions);

    // Some extra delay to let images 
    console.log(`${key}. Initiating countdown`)
    await wait(config.timeout);
    console.log(`${key}. Countdown finished`)


    // await page.screenshot({type: 'png', path: i + '.png', fullPage: true});
    let clip = await page.$eval(links[key].selector, getClip)
    await page.screenshot({type: 'png', path: key + '.png', fullPage: false, clip: clip });
    await wait(1000);
    await page.screenshot({type: 'png', path: key + '.png', fullPage: false, clip: clip });
    console.log(`${key}. Image printed`)


    await page.close()   

    console.log(`=====================================`)

}