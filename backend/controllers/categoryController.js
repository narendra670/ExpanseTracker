const Category = require("../models/Category");

const categoryController = {
  async getCategories(req, res) {
    try {
      const { type } = req.query;
      const filter = { user: req.user._id };
      if (type) filter.type = type;

      const categories = await Category.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, categories });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async createCategory(req, res) {
    try {
      const { name, icon, type, color } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const existing = await Category.findOne({
        user: req.user._id,
        name: { $regex: new RegExp(`^${name}$`, "i") },
        type: type || "expense",
      });
      if (existing) {
        return res.status(400).json({ message: "Category already exists" });
      }

      const category = await Category.create({
        user: req.user._id,
        name,
        icon: icon || "📁",
        type: type || "expense",
        color: color || "#6366f1",
      });

      res.status(201).json({ success: true, category });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateCategory(req, res) {
    try {
      let category = await Category.findOne({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.json({ success: true, category });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteCategory(req, res) {
    try {
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ success: true, message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = categoryController;
