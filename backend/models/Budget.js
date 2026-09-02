const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0, "Limit cannot be negative"],
    },
    month: {
      type: String,
      required: true,
      default: () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      },
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
