const puppeteer = require("puppeteer");
const fs = require("fs");

const urlsToScrap = [
    // URL,
    // URL
];


let nameOfMyFile = "allPagesScraped";
async function scraper() {

    console.log(`Urls are beeing scraped! ${urlsToScrap.length} pages incomming.`);

    // ==== Progress bar ====
    let startProgressBar = "[";
    let endProgressBar = "";
    urlsToScrap.forEach(() => {
        endProgressBar += " ";
    });
    endProgressBar += "]";
    process.stdout.write(startProgressBar + endProgressBar);
    // ========= END ========


    const browser = await puppeteer.launch(/*{ headless: false }*/);
    let dataOfAllUrls = [];

    for (url of urlsToScrap) {
        try {

            const page = await browser.newPage();
            await page.goto(url);

            const pageData = await page.evaluate(() => {

                let productName = document.querySelector("h1")
                    .innerText
                    .toLowerCase();

                let discipline = productName.includes("physical")
                    ? "physical"
                    : "intellectual";

                productName = productName.includes("physical")
                    ? productName.replace(" physical training", "")
                    : productName.replace(" intellectual training", "");

                let specTolerance = document.querySelector("#specsSection > div > div > div > div > div > h3:nth-child(4)")
                    .innerText.replace("xxx TOLERANCE: +/- ", "");

                let anotherSpecTolerance = document.querySelector("#specsSection > div > div > div > div > div > h3:nth-child(6)")
                    .innerText.replace("xxx TOLERANCE: +/- ", "")
                    .replace(" KILOGRAM", "") + "kg";

                let materialQuality = "premium";

                let pageObject = {
                    name: productName,
                    brand: {
                        brandName: "brand",
                        creationDate: 1111,
                        origin: "USA"
                    },
                    type: {
                        materialType: "glass",
                        materialQuality: materialQuality
                    },
                    discipline: discipline,
                    straightnessTolerance: specTolerance,
                    gpiTolerance: anotherSpecTolerance,
                    spineTolerance: null,
                    // == Will be the container of all variants in the current page beeing scraped
                    variants: []
                }

                let tableOfVariants = document.querySelectorAll("tbody > tr");

                for (row of tableOfVariants) {

                    let size = row.children[0].innerText;
                    let rating = row.children[1].innerText;
                    let outerDiameter = row.children[2].innerText;
                    let maxLength = row.children[3].innerText.slice(0, 2);
                    let innerDiameter = null;

                    let variantPageObject = {
                        size: parseInt(size),
                        innerDiameter: innerDiameter,
                        outerDiameter: outerDiameter,
                        rating: rating,
                        maxLength: maxLength,
                        sizeRecommended: null
                    };

                    pageObject.variants.push(variantPageObject);
                } // END of LOOP over variants

                return pageObject;
            }).then((data) => {

                // == Update progress bar ==
                startProgressBar = startProgressBar.replace("[", "[=");
                endProgressBar = endProgressBar.replace(" ", "");
                process.stdout.write("\r\x1b[K");
                process.stdout.write(startProgressBar + endProgressBar);
                // ========== END ==========

                dataOfAllUrls.push(data)
                // return data
            })
            // .then((data) => {

            //     fs.writeFile(
            //         `./JSONs/${data.arrowName}.json`,
            //         JSON.stringify(data, null, 2),
            //         (err) => err ? console.error("not written", err) : console.log(`ok`)
            //     );
            // })
            page.close();

        } catch (error) {

            // == Update progress bar ==
            endProgressBar = endProgressBar.replace(" ", "");
            process.stdout.write("\r\x1b[K");
            // ========== END ==========

            console.log(url + " - - --> error");
            console.log(error);
        }
    } // END of LOOP over urls
    browser.close();

    return dataOfAllUrls;
}

scraper()
    .then((data) => {
        process.stdout.write("\r\x1b[K");

        fs.writeFile(
            `./${nameOfMyFile}.json`,
            JSON.stringify(data, null, 2),
            (err) => err ? console.error("not written", err) : console.log(`- - --> Successfuly written <-- - `)
        );
    });