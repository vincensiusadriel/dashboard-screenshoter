const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path')
const moment = require('moment')

const wrapper = async (func) => {
    try {
        let data = await func
        return [data, null]
    } catch (error) {
        return [null, error]
    }
}

const toTimestamp = (strDate) => {  
    

    if (strDate == null || strDate == "") return [null, null]

    const dt = moment(strDate).unix() * 1000;  
    if(isNaN(dt)) {
        return [null, "Cannot Convert Timestamp"]
    }
    return [dt, null];  
    
  }  
  


(async() => {

    console.log(process.cwd())

    
    let raw = fs.readFileSync(path.join(process.cwd(), 'config.json'))
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

    const [browser, err] = await wrapper(puppeteer.connect({
        browserWSEndpoint: config.wsEndPoint
    }));

    if(err != null) {
        console.log('Error connecting to remote websocket')
        process.exit(0)
    }
    
    let links = config.links

    let arr = []

    if (config.specific == null || config.specific.length < 1 ) {
        for(let key in links) {
            // arr.push(
                let [, someError] = await wrapper(generate(browser, config, links, key, begin, end))
                if(someError != null) {
                    console.log(someError)
                }
            // )
        }
    } else {
        let specificLength = config.specific.length
        for (let i = 0; i < specificLength; i++) {
            if(config.specific[i] in links) {
                let [, someError] = await wrapper(generate(browser, config, links, config.specific[i], begin, end))
                if(someError != null) {
                    console.log(someError)
                }
            } else {
                console.log("Key is not in links")
            }
        }
    }
    

    // await Promise.all(arr)
    process.exit(0) 

})()

function wait (ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}


const generate = async (browser, config, links, key, begin, end) => {
    const [page, newPageError] = await wrapper(browser.newPage());
    if(newPageError != null) {
        console.log(newPageError)
        process.exit(0)
    }
    let url = links[key].link;
    const selectorOptions = {
        timeout: 180000,
        visible: true,
    };

    if(begin != null && end != null && (links[key].timestampParams != null && links[key].timestampParams != "")) {
        let timestampParams = links[key].timestampParams
        timestampParams = timestampParams.replace('{beginTimestamp}', begin).replace('{endTimestamp}', end)
        let arrStr = url.split("?")
        url = arrStr[0] + "?" + timestampParams
    }

    const [, errSetViewPort] = await wrapper(page.setViewport({
        height: 9000,
        width: 5000,
    }))

    if(errSetViewPort != null) {
        console.log(errSetViewPort)
        process.exit(0)
    }

    const [, errGoTo] = await wrapper(page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
    }));

    if(errGoTo != null) {
        console.log(errGoTo)
        process.exit(0)
    }

    //#region fullpage screenshot

    // await page.waitForSelector(links[key].selector, selectorOptions);
    // let height = await eval(`page.$eval('${links[key].selector}', element => {
    //     const { height } = element.getBoundingClientRect();
    //     return height;
    //   })`)

    //   let clip = await eval(`page.$eval('${links[key].selector}', (element) => {
    //     const { height, width, x, y } = element.getBoundingClientRect();
    //     return { height, width, x, y };
    // })`)

    // await page.setViewport({
    //     height: clip.height + clip.y,
    //     width: 5000,
    // });
    // await page.reload({
    //     waitUntil: 'domcontentloaded',
    //     timeout: 120000
    // });



    //#endregion

    const [, errWaitForSelector] = await wrapper(page.waitForSelector(links[key].selector, selectorOptions));

    if(errWaitForSelector != null) {
        console.log(errWaitForSelector)
        process.exit(0)
    }

    // Some extra delay to let images 
    console.log(`${key}. Initiating countdown`)
    const [, errWait] = await wrapper(wait(config.timeout));

    if(errWait != null) {
        console.log(errWait)
        process.exit(0)
    }
    console.log(`${key}. Countdown finished`)



    let imagePath = path.join(process.cwd(), key + '.png')

    //#region fullpage screenshot
    // await page.screenshot({type: 'png', path: imagePath, fullPage: true});
    //#endregion

    // //#region partial screenshot
    let [clip, errEval] = await wrapper(eval(`page.$eval('${links[key].selector}', (element) => {
        const { height, width, x, y } = element.getBoundingClientRect();
        return { height, width, x, y };
    })`))

    if(errEval != null) {
        console.log(errEval)
        process.exit(0)
    }

    if(links[key].scrapper != null) {
        let scrapperLength = links[key].scrapper.length
        let result = []
        for(let i = 0; i < scrapperLength; i++) {
            let scrapperObj = links[key].scrapper[i]
            if(scrapperObj.selector != null && scrapperObj.selector != "") {
                let [els,] = await wrapper(eval(`page.$$('${scrapperObj.selector}')`))

                if(els != null) {
                    for(let j  = 0; j < els.length; j++) {
                        let title = ""
                        if(scrapperObj.titleSelector == null || scrapperObj.titleSelector == "") {
                            title = scrapperObj.titleText
                        } else {
                            [title, ] = await wrapper(eval(`els[j].$eval('${scrapperObj.titleSelector}', el => el.innerText);`))
                            if(title == null) {
                                title = scrapperObj.titleText
                            }
                        }

                        let value = ""
                        let isFirst = true
    
                        if(scrapperObj.valueSelector != null) {
                            let scrapperValueLength = scrapperObj.valueSelector.length
                            for(let k = 0; k < scrapperValueLength; k++) {
                                let [tempValue, ] = await wrapper(eval(`els[j].$eval('${scrapperObj.valueSelector[k]}', el => el.innerText);`))

                                if(tempValue == null) {
                                    tempValue = ""
                                }else {
                                    if(isFirst) {
                                        isFirst = false
                                    } else {
                                        tempValue = " " + tempValue
                                    }
                                }
                                value += tempValue
                            }
                        }

                        result.push({ title: title, value: value })
                    }
                }
            }
        }

        if(result.length > 0) {
            let stringResult = JSON.stringify(result)
            fs.writeFileSync(`${key}.json`, stringResult)
            console.log(`${key}. Scrapper file printed`)
        }
    }

    const [, errSS] = await wrapper(page.screenshot({type: 'png', path: imagePath, fullPage: false, clip: { height: clip.height + clip.y + 10, width: clip.width + clip.x + 10, x: 0, y: 0 } }));

    if(errSS != null) {
        console.log(errSS)
        process.exit(0)
    }

    const [, errWait2] = await wrapper(wait(1000));

    if(errWait2 != null) {
        console.log(errWait2)
        process.exit(0)
    }
    
    const [, errSS1] = await wrapper(page.screenshot({type: 'png', path: imagePath, fullPage: false, clip: { height: clip.height + clip.y + 10, width: clip.width + clip.x + 10, x: 0, y: 0 } }));

    if(errSS1 != null) {
        console.log(errSS1)
        process.exit(0)
    }

    // //#endregion
    
    
    console.log(`${key}. Image printed`)


    const [, errClose] = await wrapper(page.close())   

    if(errClose != null) {
        console.log(errClose)
        process.exit(0)
    }
    console.log(`=====================================`)

}