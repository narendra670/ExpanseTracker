const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

const getCurrencySymbol = (currency) => {
  return currencySymbols[currency] || "₹";
};

module.exports = { getCurrencySymbol, currencySymbols };
