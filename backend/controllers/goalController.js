const Goal = require("../models/Goal");

const goalController = {
  async getGoals(req, res) {
    try {
      const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
      const goalsWithProgress = goals.map((g) => ({
        ...g.toObject(),
        progress: g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0,
      }));
      res.json({ success: true, goals: goalsWithProgress });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async createGoal(req, res) {
    try {
      const { title, targetAmount, savedAmount, targetDate, icon, color, description } =
        req.body;

      if (!title || !targetAmount) {
        return res.status(400).json({ message: "Please provide title and target amount" });
      }

      const goal = await Goal.create({
        user: req.user._id,
        title,
        targetAmount,
        savedAmount: savedAmount || 0,
        targetDate,
        icon,
        color,
        description,
      });

      res.status(201).json({ success: true, goal });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateGoal(req, res) {
    try {
      let goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.json({ success: true, goal });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteGoal(req, res) {
    try {
      const goal = await Goal.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json({ success: true, message: "Goal deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async addToGoal(req, res) {
    try {
      const { amount } = req.body;
      const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      goal.savedAmount = (goal.savedAmount || 0) + Number(amount);
      if (goal.savedAmount >= goal.targetAmount) {
        goal.status = "completed";
      }
      await goal.save();
      res.json({ success: true, goal });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = goalController;
