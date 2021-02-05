const btoa = require("btoa");
const path = require("path");
const chromium = require("chrome-aws-lambda");
const renderHTML = require("./render-html");

const normalizeTheme = (value, defaultValue) => {
  const theme = value || defaultValue;

  if (theme[0] === ".") {
    return theme;
  }

  return theme.match("jsonresume-theme-.*")
    ? theme
    : `jsonresume-theme=${theme}`;
};

const getThemePackage = (theme) => {
  if (theme[0] === ".") {
    theme = path.join(process.cwd(), theme, "index.js");
  }

  try {
    const themePackage = require(theme);
    return themePackage;
  } catch (err) {
    // Theme not installed
    throw new Error(
      "You have to install this theme relative to the folder to use it e.g. `npm install " +
        theme +
        "`"
    );
  }
};

const parse = async (resumeJson, themeName) => {
  const html = await renderHTML({
    resume: resumeJson,
    themePath: themeName,
  });
  return html;
};

module.exports = async (req, res) => {
  try {
    const { resumeData } = req.body;
    const normalizedTheme = normalizeTheme(resumeData.meta.theme, "even");
    const themePackage = getThemePackage(normalizedTheme);
    const html = await parse(resumeData, normalizedTheme);

    const browser = await chromium.puppeteer.launch();
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
      margin: {
        top: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
        right: "0.5in",
      },
      ...themePackage.pdfRenderOptions,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } catch (err) {
    res.status(500);
    res.json({
      error: err,
    });
  }
};
