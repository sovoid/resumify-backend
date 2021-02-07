const renderHTML = require("./render-html");

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

module.exports = parse;
