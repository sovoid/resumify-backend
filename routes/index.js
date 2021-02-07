const express = require("express");
const generatePDF = require("../util/generate-pdf");
const router = express.Router();

/* GET home page. */
router.post("/", async function (req, res, next) {
  try {
    const { resumeData } = req.body;
    console.log(resumeData);
    const pdf = await generatePDF(resumeData);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Internal server error",
    });
  }
});

module.exports = router;
