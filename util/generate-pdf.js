const btoa = require("btoa");
const puppeteer = require("puppeteer");
const getThemePackage = require("./get-theme-package");
const normalizeTheme = require("./normalize-theme");
const parse = require("./parse");

const generatePDF = async (resumeData) => {
  try {
    const normalizedTheme = normalizeTheme(resumeData.meta.theme, "even");
    const themePackage = getThemePackage(normalizedTheme);
    const html = await parse(resumeData, normalizedTheme);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.emulateMediaType(
      (themePackage.pdfRenderOptions &&
        themePackage.pdfRenderOptions.mediaType) ||
        "screen"
    );
    await page.goto(
      `data:text/html;base64,${btoa(unescape(encodeURIComponent(html)))}`,
      { waitUntil: "networkidle0" }
    );
    if (themePackage.pdfViewport) {
      await page.setViewport(themePackage.pdfViewport);
    }
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      ...themePackage.pdfRenderOptions,
    });
    await browser.close();
    return pdf;
  } catch (err) {
    console.log(err);
    throw new Error("Failed to generate PDF");
  }
};

module.exports = generatePDF;
