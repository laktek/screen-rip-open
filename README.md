# Screen.rip

Originally wrtten by Lakshan Perera (github.com/laktek). This software is deprecated and no longer officially supported.
Use at your own risk.

## How to run

* Pre-requisites:
  - Node.JS > 10.X.X
  - npm
* npm install
* npm run serve

### Simple GET request
Making a GET request is the easiest way to take a screenshot. Provide the URL of the page as a query string.

```
curl -X GET \
"http://localhost:3000?url=https://producthunt.com" > test.png
```

### Clip part of the page
You can configure how to capture the screenshot. Pass the configuration options as a POST request.

In the example, we pass a CSS selector to clip the screenshot to capture only the tweet popup.

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{
  "url": "https://twitter.com/BarackObama/status/896523232098078720",
  "clip": ".permalink-tweet-container",
  "format": "jpg",
  "quality": 90
}' \
"http://localhost:3000/" > obama_tweet.png
```

### Run custom scripts
The API supports running a script before taking the screenshot.

In the example, we run a script to scroll to a specific section of the page and then highlight a paragraph of the article before taking the screenshot.

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{
  "url": "http://cosmos.nautil.us/short/138/if-you-cant-find-dark-matter-look-first-for-a-dark-force",
  "runjs": "window.scroll(0, 2200); var r = document.createRange(); var p = document.querySelector(\"article p:nth-of-type(4)\"); r.selectNode(p); window.getSelection().addRange(r);"
}' \
"http://localhost:3000" > custom_script.png
```

### Generate PDFs
You can use the API to generate PDFs of web pages.

In the example, we use print a page to an A4. Note how we can use runjs option to remove elements from the page to improve readability.

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{
  "url": "http://www.paulgraham.com/ramenprofitable.html",
  "format": "pdf",
  "runjs": "document.querySelector(\"table tbody img\").remove()",
  "pdf": { "scale": 2, "format": "A4" }
}' \
"http://localhost:3000" > screenshot.pdf
```

### More options

- Set cookies (capture pages behind logins)
- Set custom HTTP Headers
- Post data
- Resize the viewport
- Wait for an element to appear on the page
- Capture full page screenshots
- Export as PNG or JPG
- 
> Screen.rip runs each request in a separate browser context and doesn't retain any data from a session.

See [Postman documentation](https://documenter.getpostman.com/view/2810998/screenrip/77ceRMN?version=latest)
