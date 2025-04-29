// ==== IMPORT REQUIRED MODULES ====

const express = require("express");

// Import the 'fs' (file system) module to interact with files (read, write)
const fs = require("fs");

// Import 'path' module to handle and transform file paths safely
const path = require("path");

const app = express();

// Create full absolute path to log.csv in the current directory
// __dirname = the folder this file is located in (in this case, /server)
const logPath = path.join(__dirname, "log.csv");

// ==== MIDDLEWARE TO LOG EVERY INCOMING REQUEST ====

// This middleware runs for every incoming HTTP request
app.use((req, res, next) => {
  // 'finish' event is emitted when the response is fully sent
  res.on("finish", () => {
    // Extract the user-agent string from request headers
    // .split and .join removes commas to avoid breaking CSV formatting
    const agent = req.headers["user-agent"].split(",").join("");

    // Get the current timestamp as a string in ISO format
    const time = new Date().toISOString();

    // Get the HTTP method (GET, POST, etc.)
    const method = req.method;

    // Get the requested resource path (like '/', '/about', etc.)
    const resource = req.originalUrl;

    // Get the HTTP version and format it like 'HTTP/1.1'
    const version = `HTTP/${req.httpVersion}`;

    // Get the response status code (like 200, 404, etc.)
    const status = res.statusCode;

    // Format all the data into a single CSV line
    const logData = `${agent},${time},${method},${resource},${version},${status}\n`;

    // Print the log line to the console
    // This is important because the tests watch console.log output
    console.log(logData);

    // Append the log line to 'log.csv'
    // 'appendFile' adds data to the file without overwriting existing content
    fs.appendFile(logPath, logData, (err) => {
      if (err) {
        // If there's an error writing to the file, print an error message
        console.error("Error writing to log file:", err);
      }
    });
  });

  // Calls next middleware or route handler
  next();
});

// ==== ROUTE: GET / ====

// Handles GET requests to the root path (e.g., http://localhost:3000/)
// Responds with a plain text "ok" and a 200 status code
app.get("/", (req, res) => {
  res.status(200).send("ok");
});

// ==== ROUTE: GET /logs ====

// Handles GET requests to '/logs' path
// Returns all the logged entries as a JSON array
app.get("/logs", (req, res) => {
  // Read the contents of 'log.csv' as a UTF-8 string
  fs.readFile(logPath, "utf8", (err, data) => {
    if (err) {
      // If there's an error reading the file, respond with 500 error
      console.error("Error reading log file:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Trim whitespace and split file contents into lines (by newline character (\n))
    const lines = data.trim().split("\n");

    // Process each line AFTER the header (slice(1))
    // For each log entry, split the line into individual fields
    const logs = lines.slice(1).map((line) => {
      const fields = line.split(",");
      // Build and return a structured object for each log entry
      return {
        Agent: fields[0],
        Time: fields[1],
        Method: fields[2],
        Resource: fields[3],
        Version: fields[4],
        Status: fields[5],
      };
    });

    // Respond with the structured log entries as a JSON object
    res.json(logs);
  });
});

module.exports = app;
