const User = require("../models/User");
const { generateToken } = require("../utils/generateToken");

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Rent",
  "Bills",
  "Education",
  "Healthcare",
  "Entertainment",
  "Travel",
  "Other",
];

const authController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Please provide all fields" });
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await User.create({ name, email, password });

      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          theme: user.theme,
          monthlyBudget: user.monthlyBudget,
          profilePicture: user.profilePicture,
        },
        defaultCategories: DEFAULT_CATEGORIES,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          theme: user.theme,
          monthlyBudget: user.monthlyBudget,
          profilePicture: user.profilePicture,
        },
        defaultCategories: DEFAULT_CATEGORIES,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getUserProfile(req, res) {
    try {
      const user = await User.findById(req.user._id).select("-password");
      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, email, currency, monthlyBudget, notificationsEnabled, theme } =
        req.body;
      const user = await User.findById(req.user._id);

      if (user) {
        user.name = name || user.name;
        user.email = email || user.email;
        user.currency = currency || user.currency;
        user.monthlyBudget =
          monthlyBudget !== undefined ? monthlyBudget : user.monthlyBudget;
        user.notificationsEnabled =
          notificationsEnabled !== undefined
            ? notificationsEnabled
            : user.notificationsEnabled;
        user.theme = theme || user.theme;

        if (req.file) {
          user.profilePicture = `/uploads/${req.file.filename}`;
        }

        const updatedUser = await user.save();
        res.json({
          success: true,
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            currency: updatedUser.currency,
            theme: updatedUser.theme,
            monthlyBudget: updatedUser.monthlyBudget,
            notificationsEnabled: updatedUser.notificationsEnabled,
            profilePicture: updatedUser.profilePicture,
          },
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = authController;
