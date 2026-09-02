const mongoose = require("mongoose");

const connectWithTimeout = (uri, timeoutMs = 10000) => {
  return Promise.race([
    mongoose.connect(uri),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timed out")), timeoutMs)
    ),
  ]);
};

const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI;
  const fallbackURI = process.env.MONGODB_URI_LOCAL || "mongodb://localhost:27017/expense-tracker";

  try {
    const conn = await connectWithTimeout(primaryURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (primaryError) {
    console.warn(
      `Could not connect to primary MongoDB (${primaryError.message}). Trying local fallback...`
    );
    try {
      const conn = await connectWithTimeout(fallbackURI);
      console.log(`MongoDB Connected (fallback): ${conn.connection.host}`);
      return conn;
    } catch (fallbackError) {
      console.error(`Failed to connect to fallback MongoDB: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
