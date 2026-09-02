const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    icon: {
      type: String,
      default: "📁",
    },
    type: {
      type: String,
      default: "expense",
      enum: ["expense", "income"],
    },
    color: {
      type: String,
      default: "#6366f1",
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
