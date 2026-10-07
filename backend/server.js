

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error.message);
    });
const reportRoutes = require("./routes/reportRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
// ================================
// MIDDLEWARE
// ================================

app.use(express.json());
app.use(express.static("../frontend"));
app.use("/api/reports", reportRoutes);

// ================================
// BASIC ROUTE
// ================================

app.get("/", (req, res) => {
    res.json({
        message: "DataDoctor Backend is running 🩺"
    });
});


// ================================
// TEST API
// ================================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "DataDoctor API is working!"
    });

});


// ================================
// START SERVER
// ================================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `DataDoctor server running on http://localhost:${PORT}`
    );

});