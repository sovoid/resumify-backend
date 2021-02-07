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

module.exports = normalizeTheme;
