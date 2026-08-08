const app = require('./src/app');

// Read PORT from environment variables, defaulting to 5000
const PORT = process.env.PORT || 5000;

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
