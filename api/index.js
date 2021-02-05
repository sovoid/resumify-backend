const path = require("path");
const chromium = require("chrome-aws-lambda");

/**
 * Normalizes the theme name by adding a prefix `jsonresume-theme` if not present
 * @param {String} value Name of the theme
 * @param {String} defaultValue Default Theme
 */
const normalizeTheme = (value, defaultValue = "even") => {
  const theme = value || defaultValue;

  // If theme has a relative path provided, immediately return
  if (theme[0] === ".") {
    return theme;
  }

  return theme.match("jsonresume-theme-.*")
    ? theme
    : `jsonresume-theme-${theme}`;
};

/**
 * Returns the theme Package
 * @param {String} theme Normalized theme name
 */
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

/**
 * Parses the `resumeJson` to render a pretty HTML
 * @param {Object} resumeJson Resume data
 * @param {String} themeName Name of the theme
 */
const parse = async (resumeJson, themeName) => {
  const html = await renderHTML({
    resume: resumeJson,
    themePath: themeName,
  });
  return html;
};

const tryResolve = (...args) => {
  try {
    return require.resolve(...args);
  } catch (err) {
    return false;
  }
};

const renderHTML = async ({ resume, themePath }) => {
  const cwd = process.cwd();
  let path;

  if (themePath[0] === ".") {
    path = tryResolve(path.join(cwd, themePath), { paths: [cwd] });
    throw new Error(
      `Theme ${themePath} could not be resolved relative to ${cwd}`
    );
  }

  if (!path) {
    path = tryResolve(themePath, { paths: [cwd] });
  }

  if (!path) {
    throw new Error(
      `theme path ${themePath} could not be resolved from current working directory`
    );
  }

  const theme = require(path);

  if (typeof theme?.render !== "function") {
    throw new Error("theme.render is not a function");
  }

  return theme.render(resume);
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
      `data:text/html;base64,${Buffer.from(
        unescape(encodeURIComponent(html))
      ).toString("base64")}`,
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
