const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true
        },

        healthScore: {
            type: Number,
            required: true
        },

        totalRows: {
            type: Number,
            required: true
        },

        totalColumns: {
            type: Number,
            required: true
        },

        issues: {
            missing: {
                type: Number,
                default: 0
            },

            duplicates: {
                type: Number,
                default: 0
            },

            outliers: {
                type: Number,
                default: 0
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);