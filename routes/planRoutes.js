const router = require("express").Router();
const Plan = require("../models/Plan");

// create demo (remove in prod)
router.post("/seed", async (req, res) => {
  const base = [
    { event: "Order / Go Ahead release", responsible:{name:"RENAULT"}, startDate:"2025-06-01", finishDate:"2025-06-01", completion:100 },
    { event: "Tool Design",              responsible:{name:"Dharmaraja",email:"d@sakthiauto.co"}, startDate:"2025-06-02", finishDate:"2025-06-08", completion:100 },
    { event: "Tool Manufacturing",       responsible:{name:"Dharmaraja"}, startDate:"2025-06-09", finishDate:"2025-06-22", completion:100 },
    { event: "Tool Trial & Proveout",    responsible:{name:"Dharmaraja"}, startDate:"2025-06-23", finishDate:"2025-06-29", completion:100 },
    { event: "Submission to Machine",    responsible:{name:"Dharmaraja"}, startDate:"2025-06-30", finishDate:"2025-07-06", completion:100 },
  ];
  await Plan.deleteMany({});
  const docs = await Plan.insertMany(base);
  res.json(docs);
});

// list
router.get("/", async (req, res) => {
  const rows = await Plan.find().sort({ startDate: 1 });
  res.json(rows);
});

module.exports = router;
