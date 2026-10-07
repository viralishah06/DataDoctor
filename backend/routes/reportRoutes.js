const express = require("express");

const router = express.Router();

const {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport
} = require("../controllers/reportController");

// GET all reports
router.get("/", getReports);

// GET one report
router.get("/:id", getReportById);

// CREATE report
router.post("/", createReport);

// UPDATE report
router.put("/:id", updateReport);

// DELETE report
router.delete("/:id", deleteReport);

module.exports = router;