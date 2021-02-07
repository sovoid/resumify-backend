const path = require("path");

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

module.exports = getThemePackage;
