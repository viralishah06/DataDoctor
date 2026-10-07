const csvFile = document.getElementById("csvFile");
const fileInfo = document.getElementById("fileInfo");
const dashboard = document.getElementById("dashboard");
const scanBtn = document.getElementById("scanBtn");
let selectedFile = null;
let csvData = [];
csvFile.addEventListener("change", handleUpload);
scanBtn.addEventListener("click", scanDataset);
/* Handle CSV file upload */
function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Please select a CSV file.");
        csvFile.value = "";
        return;
    }
    selectedFile = file;
    fileInfo.classList.remove("hidden");
    fileInfo.textContent =
        `Selected: ${file.name} (${formatBytes(file.size)})`;

    const reader = new FileReader();

    reader.onload = event => {
        csvData = parseCSV(event.target.result);

        if (!csvData.length) {
            alert("The CSV file appears to be empty.");
            return;
        }

        dashboard.classList.remove("hidden");

        document.getElementById("datasetName").textContent =
            file.name;

        renderPreview(csvData);
        updateOverview(csvData);

        dashboard.scrollIntoView({
            behavior: "smooth"
        });
    };

    reader.readAsText(file);
}


/* Parse CSV data */

function parseCSV(text) {
    const lines = text
        .replace(/\r/g, "")
        .split("\n")
        .filter(line => line.trim());

    if (lines.length < 2) {
        return [];
    }

    const headers = splitCSVLine(lines[0]);

    return lines.slice(1).map(line => {
        const values = splitCSVLine(line);
        const row = {};

        headers.forEach((header, index) => {
            row[header.trim()] =
                (values[index] ?? "").trim();
        });

        return row;
    });
}


/* Split CSV line while handling quoted values */

function splitCSVLine(line) {
    const result = [];

    let value = "";
    let quoted = false;

    for (const char of line) {

        if (char === '"') {
            quoted = !quoted;
        }

        else if (char === "," && !quoted) {
            result.push(value);
            value = "";
        }

        else {
            value += char;
        }
    }

    result.push(value);

    return result;
}


/* Render CSV preview */

function renderPreview(data) {

    const table =
        document.getElementById("previewTable");

    const headers =
        Object.keys(data[0]);

    table.innerHTML = "";

    const thead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");

    headers.forEach(header => {

        const th =
            document.createElement("th");

        th.textContent = header;

        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    const tbody =
        document.createElement("tbody");

    data.forEach(row => {

        const tableRow =
            document.createElement("tr");

        headers.forEach(header => {

            const td =
                document.createElement("td");

            td.textContent = row[header];

            tableRow.appendChild(td);
        });

        tbody.appendChild(tableRow);
    });

    table.append(thead, tbody);

    document.getElementById("previewStatus").textContent =
        `Showing all${data.length} rows`;
}


/* Update dataset overview */

function updateOverview(data) {

    document.getElementById("rowCount").textContent =
        data.length;

    document.getElementById("columnCount").textContent =
        Object.keys(data[0]).length;
}


/* Scan dataset */

async function scanDataset() {

    if (!selectedFile || !csvData.length) {
        return;
    }

    const columnDiagnosis =
        diagnoseColumns(csvData);

    const headers =
        Object.keys(csvData[0]);

    let missing = 0;

    csvData.forEach(row => {

        headers.forEach(header => {

            if (row[header] === "") {
                missing++;
            }

        });

    });


    /* Find duplicate rows */

    const serialized =
        csvData.map(row =>
            JSON.stringify(row)
        );

    const duplicates =
        csvData.length -
        new Set(serialized).size;


    /* Calculate health score */

    const score =
        calculateHealthScore(
            missing,
            duplicates,
            columnDiagnosis,
            csvData.length
        );


    /* Count outliers */

    const totalOutliers =
        columnDiagnosis.reduce(
            (total, column) => {

                return total +
                    (column.outliers
                        ? column.outliers.length
                        : 0);

            },
            0
        );


    /* Update dashboard */

    document.getElementById("missingCount").textContent =
        missing;

    document.getElementById("duplicateCount").textContent =
        duplicates;

    document.getElementById("healthScore").textContent =
        score;

    document.getElementById("healthTitle").textContent =
        healthTitle(score);

    document.getElementById("healthMessage").textContent =
        healthMessage(score);

    document.getElementById("previewStatus").textContent =
        "Scan complete";


    /* Display issues */

    renderIssues(
        missing,
        duplicates,
        columnDiagnosis
    );

    displayColumnDiagnosis(
        columnDiagnosis
    );


    /* Create report */

    const report = {

        fileName: selectedFile.name,

        healthScore: score,

        totalRows: csvData.length,

        totalColumns:
            Object.keys(csvData[0]).length,

        issues: {

            missing: missing,

            duplicates: duplicates,

            outliers: totalOutliers
        }
    };


    /* Save report to MongoDB */

    try {

        const response =
            await fetch(
                "/api/reports",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(report)
                }
            );


        const result =
            await response.json();


        if (result.success) {

            console.log(
                "Report saved to MongoDB:",
                result.report
            );

            await loadSavedReports();

        }

        else {

            console.error(
                "Failed to save report:",
                result
            );

        }

    }

    catch (error) {

        console.error(
            "MongoDB save error:",
            error
        );

    }
}


/* Render detected issues */

function renderIssues(
    missing,
    duplicates,
    columnDiagnosis
) {

    const box =
        document.getElementById("issuesList");

    box.innerHTML = "";

    let issueFound = false;


    /* Missing values */

    if (missing) {

        issueFound = true;

        addIssue(
            "⚠️ Missing Values",
            `${missing} empty value(s) detected.`,
            missing
        );
    }


    /* Duplicate rows */

    if (duplicates) {

        issueFound = true;

        addIssue(
            "🔁 Duplicate Rows",
            `${duplicates} duplicate row(s) detected.`,
            duplicates
        );
    }


    /* Column issues */

    columnDiagnosis.forEach(column => {


        /* Outliers */

        if (
            column.outliers &&
            column.outliers.length > 0
        ) {

            issueFound = true;

            const outlierText =
                column.outliers
                    .map(value => `"${value}"`)
                    .join(", ");


            addIssue(

                `📈 ${column.column} — Outlier Detected`,

                `Unusual value(s): ${outlierText}<br>
                 These values are significantly different
                 from the other values in this column.`,

                column.outliers.length

            );
        }


        /* Mixed data */

        if (
            column.invalidValues &&
            column.invalidValues.length > 0
        ) {

            issueFound = true;

            const invalidText =
                column.invalidValues
                    .map(item =>
                        `"${item.value}" — Row ${item.row}`
                    )
                    .join("<br>");


            addIssue(

                `⚠️ ${column.column} — Mixed Data`,

                `Invalid value(s):<br>${invalidText}`,

                column.invalidValues.length

            );
        }

    });


    /* No issues */

    if (!issueFound) {

        box.innerHTML =
            '<div class="empty">✅ No basic issues detected in this scan.</div>';

    }
}


/* Add issue card */

function addIssue(
    title,
    description,
    count
) {

    const card =
        document.createElement("div");

    card.className = "issue";

    card.innerHTML = `
        <h4>${title}</h4>

        <p>${description}</p>

        <b>${count} issue(s)</b>
    `;

    document
        .getElementById("issuesList")
        .appendChild(card);
}


/* Format file size */

function formatBytes(bytes) {

    if (!bytes) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return `${(
        bytes /
        Math.pow(1024, index)
    ).toFixed(1)} ${units[index]}`;
}


/* Detect column type */

function detectColumnType(values) {

    const cleanedValues =
        values.filter(
            value => value !== ""
        );


    if (cleanedValues.length === 0) {
        return "Empty";
    }


    const numberCount =
        cleanedValues.filter(value => {

            return (
                !isNaN(value) &&
                value.trim() !== ""
            );

        }).length;


    const dateCount =
        cleanedValues.filter(value => {

            return !isNaN(
                Date.parse(value)
            );

        }).length;


    if (
        numberCount ===
        cleanedValues.length
    ) {
        return "Number";
    }


    if (
        numberCount > 0 &&
        numberCount < cleanedValues.length
    ) {
        return "Mixed";
    }


    if (
        dateCount ===
        cleanedValues.length
    ) {
        return "Date";
    }


    return "Text";
}


/* Diagnose columns */

function diagnoseColumns(data) {

    const headers =
        Object.keys(data[0]);

    const diagnosis = [];


    headers.forEach(header => {

        const values =
            data.map(row =>
                row[header]
            );


        const type =
            detectColumnType(values);


        const invalidValues =
            findInvalidValues(
                values,
                type
            );


        const statistics =
            type === "Number"
                ? calculateStatistics(values)
                : null;


        const outliers =
            type === "Number"
                ? findOutliers(values)
                : [];


        diagnosis.push({

            column: header,

            type: type,

            totalValues:
                values.length,

            missingValues:
                values.filter(
                    value => value === ""
                ).length,

            statistics:
                statistics,

            invalidValues:
                invalidValues,

            outliers:
                outliers

        });

    });


    return diagnosis;
}


/* Display column diagnosis */

function displayColumnDiagnosis(
    diagnosis
) {

    const tableBody =
        document.querySelector(
            "#columnDiagnosisTable tbody"
        );

    tableBody.innerHTML = "";


    diagnosis.forEach(item => {

        const row =
            document.createElement("tr");


        let statisticsText = "—";


        if (item.statistics) {

            statisticsText = `
                Avg: ${item.statistics.average.toFixed(2)}<br>
                Min: ${item.statistics.minimum}<br>
                Max: ${item.statistics.maximum}
            `;

        }


        let outlierText = "—";


        if (
            item.outliers &&
            item.outliers.length > 0
        ) {

            outlierText =
                `<span class="missing-badge">
                    ${item.outliers.join(", ")}
                </span>`;

        }


        row.innerHTML = `

            <td>
                <strong>
                    ${item.column}
                </strong>
            </td>

            <td>
                <span class="type-badge">
                    ${item.type}
                </span>
            </td>

            <td>
                ${item.totalValues}
            </td>

            <td>
                <span class="${
                    item.missingValues > 0
                        ? "missing-badge"
                        : ""
                }">
                    ${item.missingValues}
                </span>
            </td>

            <td>
                ${statisticsText}
            </td>

            <td>
                ${outlierText}
            </td>

        `;


        tableBody.appendChild(row);

    });
}


/* Calculate statistics */

function calculateStatistics(values) {

    const numbers =
        values

            .filter(
                value => value !== ""
            )

            .map(
                value => Number(value)
            )

            .filter(
                value => !isNaN(value)
            );


    if (numbers.length === 0) {
        return null;
    }


    const total =
        numbers.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    const average =
        total / numbers.length;


    const minimum =
        Math.min(...numbers);


    const maximum =
        Math.max(...numbers);


    return {

        count:
            numbers.length,

        average:
            average,

        minimum:
            minimum,

        maximum:
            maximum

    };
}


/* Find invalid values */

function findInvalidValues(
    values,
    type
) {

    const invalidValues = [];


    if (type === "Mixed") {

        values.forEach(
            (value, index) => {

                if (value === "") {
                    return;
                }


                if (isNaN(Number(value))) {

                    invalidValues.push({

                        row: index + 2,

                        value: value

                    });

                }

            }
        );

    }


    return invalidValues;
}


/* Find numeric outliers */

function findOutliers(values) {

    const numbers =
        values

            .map(
                value => Number(value)
            )

            .filter(
                value => !isNaN(value)
            );


    if (numbers.length < 4) {
        return [];
    }


    numbers.sort(
        (a, b) => a - b
    );


    const q1 =
        getPercentile(
            numbers,
            25
        );


    const q3 =
        getPercentile(
            numbers,
            75
        );


    const iqr =
        q3 - q1;


    const lowerLimit =
        q1 - 1.5 * iqr;


    const upperLimit =
        q3 + 1.5 * iqr;


    return numbers.filter(
        number => {

            return (
                number < lowerLimit ||
                number > upperLimit
            );

        }
    );
}


/* Calculate percentile */

function getPercentile(
    numbers,
    percentile
) {

    const index =
        (percentile / 100) *
        (numbers.length - 1);


    const lower =
        Math.floor(index);


    const upper =
        Math.ceil(index);


    if (lower === upper) {
        return numbers[lower];
    }


    return (
        numbers[lower] +
        (numbers[upper] -
            numbers[lower]) *
        (index - lower)
    );
}


/* Calculate health score */

function calculateHealthScore(
    missing,
    duplicates,
    columnDiagnosis,
    totalRows
) {

    let score = 100;


    /* Missing values */

    if (totalRows > 0) {

        const missingPenalty =
            (
                missing /
                (
                    totalRows *
                    columnDiagnosis.length
                )
            ) * 30;


        score -= missingPenalty;

    }


    /* Duplicate rows */

    if (totalRows > 0) {

        const duplicatePenalty =
            (
                duplicates /
                totalRows
            ) * 25;


        score -= duplicatePenalty;

    }


    /* Mixed / invalid values */

    let invalidCount = 0;


    columnDiagnosis.forEach(
        column => {

            if (column.invalidValues) {

                invalidCount +=
                    column.invalidValues.length;

            }

        }
    );


    if (totalRows > 0) {

        score -=
            (
                invalidCount /
                totalRows
            ) * 25;

    }


    /* Outliers */

    let outlierCount = 0;


    columnDiagnosis.forEach(
        column => {

            if (column.outliers) {

                outlierCount +=
                    column.outliers.length;

            }

        }
    );


    if (totalRows > 0) {

        score -=
            (
                outlierCount /
                totalRows
            ) * 20;

    }


    /* Keep score between 0 and 100 */

    score =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );


    return Math.round(score);
}


/* Dataset health title */

function healthTitle(score) {

    if (score >= 90) {
        return "Excellent dataset";
    }

    if (score >= 75) {
        return "Healthy dataset";
    }

    if (score >= 50) {
        return "Needs attention";
    }

    return "Critical dataset";
}


/* Dataset health message */

function healthMessage(score) {

    if (score >= 90) {

        return "Your dataset looks very clean with only minor or no issues.";

    }

    if (score >= 75) {

        return "Your dataset is mostly healthy, but a few issues should be reviewed.";

    }

    if (score >= 50) {

        return "Several data-quality issues were detected and should be reviewed.";

    }

    return "Your dataset contains significant quality issues and needs cleaning.";
}


/* Load saved reports */

async function loadSavedReports() {

    const savedReportsContainer =
        document.getElementById(
            "savedReports"
        );


    try {

        const response =
            await fetch(
                "/api/reports"
            );


        const result =
            await response.json();


        if (
            !result.success ||
            result.reports.length === 0
        ) {

            savedReportsContainer.innerHTML =
                '<p class="empty">📋 No saved reports yet.</p>';

            return;
        }


        savedReportsContainer.innerHTML = "";


        result.reports.forEach(
            report => {

                const reportCard =
                    document.createElement(
                        "div"
                    );


                reportCard.className =
                    "report-card";


                reportCard.innerHTML = `

                    <h3>
                        ${report.fileName}
                    </h3>

                    <p>
                        <strong>
                            Health Score:
                        </strong>
                        ${report.healthScore}
                    </p>

                    <p>
                        <strong>
                            Rows:
                        </strong>
                        ${report.totalRows}
                    </p>

                    <p>
                        <strong>
                            Columns:
                        </strong>
                        ${report.totalColumns}
                    </p>

                    <p>
                        <strong>
                            Missing:
                        </strong>
                        ${report.issues.missing}
                    </p>

                    <p>
                        <strong>
                            Duplicates:
                        </strong>
                        ${report.issues.duplicates}
                    </p>

                    <p>
                        <strong>
                            Outliers:
                        </strong>
                        ${report.issues.outliers}
                    </p>


                    <div class="report-actions">

                        <button
                            class="view-report-btn"
                            type="button"
                        >
                            View Report
                        </button>


                        <button
                            class="delete-report-btn"
                            type="button"
                        >
                            Delete Report
                        </button>

                    </div>

                `;


                savedReportsContainer
                    .appendChild(
                        reportCard
                    );


                const viewButton =
                    reportCard.querySelector(
                        ".view-report-btn"
                    );


                viewButton.addEventListener(
                    "click",
                    () => {
                        viewReport(
                            report._id
                        );
                    }
                );


                const deleteButton =
                    reportCard.querySelector(
                        ".delete-report-btn"
                    );


                deleteButton.addEventListener(
                    "click",
                    () => {
                        deleteReport(
                            report._id
                        );
                    }
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Failed to load saved reports:",
            error
        );

    }
}


/* View saved report */

async function viewReport(
    reportId
) {

    try {

        const response =
            await fetch(
                `/api/reports/${reportId}`
            );


        const result =
            await response.json();


        if (!result.success) {

            console.error(
                "Failed to fetch report:",
                result
            );

            return;
        }


        const report =
            result.report;


        const details =
            document.getElementById(
                "reportDetailsContent"
            );


        details.innerHTML = `

            <h3>
                ${report.fileName}
            </h3>


            <p>
                <strong>
                    Generated:
                </strong>

                ${new Date(
                    report.createdAt
                ).toLocaleString()}
            </p>


            <div class="health-score-display">

                <h3>
                    Health Score
                </h3>


                <div class="score-circle">
                    ${report.healthScore}
                </div>


                <p>
                    Overall Dataset Quality
                </p>

            </div>


            <div class="issue-summary">

                <div class="issue-card">

                    <h4>
                        Missing Values
                    </h4>

                    <p>
                        ${report.issues.missing}
                    </p>

                </div>


                <div class="issue-card">

                    <h4>
                        Duplicates
                    </h4>

                    <p>
                        ${report.issues.duplicates}
                    </p>

                </div>


                <div class="issue-card">

                    <h4>
                        Outliers
                    </h4>

                    <p>
                        ${report.issues.outliers}
                    </p>

                </div>

            </div>


            <p>
                <strong>
                    Total Rows:
                </strong>

                ${report.totalRows}
            </p>


            <p>
                <strong>
                    Total Columns:
                </strong>

                ${report.totalColumns}
            </p>


            <div class="recommendations">

                <h3>
                    💡 Recommendations
                </h3>


                ${
                    report.issues.missing > 0

                        ? "<p>• Review and fill missing values where appropriate.</p>"

                        : "<p>• No missing values detected.</p>"
                }


                ${
                    report.issues.duplicates > 0

                        ? "<p>• Check duplicate rows before using the dataset.</p>"

                        : "<p>• No duplicate rows detected.</p>"
                }


                ${
                    report.issues.outliers > 0

                        ? "<p>• Review outlier values to determine whether they are valid.</p>"

                        : "<p>• No outliers detected.</p>"
                }

            </div>

        `;


        document
            .getElementById(
                "reportDetails"
            )
            .scrollIntoView({
                behavior: "smooth"
            });

    }

    catch (error) {

        console.error(
            "View report error:",
            error
        );

    }
}


/* Delete saved report */

async function deleteReport(
    reportId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this report?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/reports/${reportId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (result.success) {

            console.log(
                "Report deleted successfully"
            );

            await loadSavedReports();

        }

        else {

            console.error(
                "Delete failed:",
                result
            );

        }

    }

    catch (error) {

        console.error(
            "Delete error:",
            error
        );

    }
}


/* Load saved reports when page opens */

document.addEventListener(
    "DOMContentLoaded",
    loadSavedReports
);