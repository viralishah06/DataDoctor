# 🩺 DataDoctor

DataDoctor is a web-based CSV data-quality analyzer that helps users inspect datasets and identify common data-quality problems.

## Features

- Upload CSV files
- Preview uploaded datasets
- Detect missing values
- Detect duplicate rows
- Detect numerical outliers
- Detect mixed/invalid data
- Calculate an overall dataset health score
- Display column-level diagnosis
- Save reports to MongoDB
- View previously saved reports
- Delete saved reports
- Display report recommendations

## Technologies Used

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- Mongoose

### Database
- MongoDB Atlas

## Project Structure

```text
DataDoctor/
│
├── README.md
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
└── backend/
    ├── server.js
    ├── controllers/
    │   └── reportController.js
    ├── routes/
    │   └── reportRoutes.js
    ├── models/
    │   └── Report.js
    ├── .env
    ├── .gitignore
    ├── package.json
    └── package-lock.json