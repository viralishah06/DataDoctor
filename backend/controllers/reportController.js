const Report = require("../models/Report");

// GET all reports
const getReports = async (req, res) => {
    try {
        const reports = await Report.find();

        res.json({
            success: true,
            reports: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
};

// GET one report by ID
const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch report"
        });
    }
};

// CREATE a report
const createReport = async (req, res) => {
    try {
        const newReport = await Report.create(req.body);

        res.status(201).json({
            success: true,
            message: "Report created successfully",
            report: newReport
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create report"
        });
    }
};

// UPDATE a report
const updateReport = async (req, res) => {
    try {
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedReport) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.json({
            success: true,
            message: "Report updated successfully",
            report: updatedReport
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update report"
        });
    }
};

// DELETE a report
const deleteReport = async (req, res) => {
    try {
        const deletedReport = await Report.findByIdAndDelete(
            req.params.id
        );

        if (!deletedReport) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.json({
            success: true,
            message: "Report deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete report"
        });
    }
};
module.exports = {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport
};