# dashboard-screenshoter
A Mini app that automate screenshot dashboard process like Grafana Or DataDog using Puppeteer





# How to Use
- First Copy the executable file (index-{ system name }) and the json in the same folder

- Open Chrome Headless browser using the following command :
  - For Mac :
  ```
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --headless --no-default-browser-check --user-data- dir=$(mktemp -d -t 'chrome-remote_data_dir')
  ```

- Once it is runned, it will output the following message : 
```
DevTools listening on ws://127.0.0.1:9222/devtools/browser/eb88a31c-79af-4f9c-97f0-058f5fe3f783
```

- Copy the websocket address to config.json on wsEndPoint ( keep in mind, that config.json must be in the same folder as the executable) :
```
Example :
"wsEndPoint": "ws://127.0.0.1:9222/devtools/browser/eb88a31c-79af-4f9c-97f0-058f5fe3f783",
```

- Open Chrome, and enter address : "http://localhost:9222/", you will be prompted to view "Headless Remote Debugging Page"

- Click the about:blank link and enter the dashboard addresses, then enter the login credentials to the dashboard addresses you wish to view (This is done to bypass login session and make sure the app can take screenshot without have to be redirected to login pages)

- After entering the login session run the app executable and enjoy :)


# Configuration

    "timeout": 10000,                             //amount of millisecond to wait for the dashboard to completely render
    "wsEndPoint": "ws://127.0.0.1:9222/devtools/browser/eb88a31c-79af-4f9c-97f0-058f5fe3f783",       //chrome remote debugging websocket address
    "beginTimestamp": "2021-10-08 08:00:00",      //dashboard begin timestamp (in datadog and grafana)
    "endTimestamp": "2021-10-08 09:00:00",        //dashboard end timestamp (in datadog and grafana)
    "specific": "",                               //specify 1 specific link to screenshot (to provide retake if something goes wrong), ex : grafana play-grpc
    "links": {                                    //list of link in key value pair (key = filename, value = link configuration) 
        "grafana play-grpc": {
            "selector": ".react-grid-layout",     //selector used to point which class or id in page containing the dashboard ( this is done to measure the snapshot size)
            "link": "https://somedashboard.net/d/DasHBoard/gcp-dashboard?orgId=5&refresh=5s", // dashboard link
            "timestampParams": "orgId=5&refresh=5s&from={beginTimestamp}&to={endTimestamp}"               // parameter if there is timestamp ( some dashboard has totally different queryParams for timestamp, this will replace all the queryParams to a formatted timestamp queryParams), {beginTimestamp} and {endTimestamp} will be replaced with timestamp of the begin and end timestamp properties
        },
