const mongoose = require("mongoose");

const recurringExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    frequency: {
      type: String,
      required: true,
      enum: ["Daily", "Weekly", "Monthly", "Yearly"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      default: "Cash",
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Wallet", "Other"],
    },
    nextPaymentDate: {
      type: Date,
    },
    lastProcessedDate: {
      type: Date,
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

module.exports = mongoose.model("RecurringExpense", recurringExpenseSchema);
