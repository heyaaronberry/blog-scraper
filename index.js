const express = require("express");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs").promises;
const path = require("path");
const app = express();
const port = 3000;

app.use(express.json());

app.post("/scrape/", async (req, res) => {
    const elementId = "content-blocks"; // Set the element ID to "content-blocks"
    const results = [];

    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments("--headless");
    chromeOptions.addArguments("--disable-gpu");
    chromeOptions.addArguments("--no-sandbox");
    chromeOptions.addArguments("start-maximized");
    chromeOptions.addArguments("disable-infobars");
    chromeOptions.addArguments("--disable-extensions");

    const driver = new Builder()
        .forBrowser("chrome")
        .setChromeOptions(chromeOptions)
        .build();

    try {
        const sitemapFolder = "sitemap";
        const urlsFilePath = path.join(sitemapFolder, "urls.txt");
        const urls = await fs.readFile(urlsFilePath, "utf-8");
        const urlList = urls.split("\n").map(url => url.trim());

        const resultsFolder = "results"; // Create a folder called "results"
        await fs.mkdir(resultsFolder, { recursive: true }); // Ensure the "results" folder exists

        const outputFilePath = path.join(resultsFolder, "scraped_data.json");

        for (let index = 0; index < urlList.length; index++) {
            const url = urlList[index];
            console.log(`Scraping ${url}...`);
            await driver.get(url);
            
            // Wait for the element with ID "content-blocks" to be present
            const element = await driver.wait(until.elementLocated(By.id(elementId)));
            
            const data = await element.getText();
            results.push({ index: index + 1, url, text: data });
            console.log(`Scraped ${url}: ${data}`);

            // Write the data to the JSON file immediately after scraping
            await fs.writeFile(outputFilePath, JSON.stringify(results, null, 2), "utf-8");
        }

        console.log("Scraping completed.");
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred during scraping." });
    } finally {
        await driver.quit();
    }
});

app.listen(port, () => {
    console.log(`FastAPI server listening at http://localhost:${port}`);
});
