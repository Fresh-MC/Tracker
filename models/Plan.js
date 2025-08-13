const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  event: { type: String, required: true },                    // "Tool Manufacturing"
  responsible: {
    name: String,
    email: String
  },
  startDate: { type: Date, required: true },
  finishDate: { type: Date, required: true },
  completion: { type: Number, default: 0 },                   // 0–100
}, { timestamps: true });

planSchema.virtual("noOfDays").get(function () {
  const d = Math.ceil((this.finishDate - this.startDate)/(1000*60*60*24)) + 1;
  return Math.max(1, d);
});

planSchema.set("toJSON", { virtuals: true });
planSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Plan", planSchema);
