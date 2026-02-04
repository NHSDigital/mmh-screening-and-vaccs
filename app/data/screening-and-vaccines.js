module.exports = [
  // screening
  {
    id: "bowel-cancer",
    name: "Bowel cancer screening",
    type: "screening",
    minAge: 56,
    maxAge: 74,
    sex: "all"
  },
  {
    id: "breast-cancer",
    name: "Breast cancer screening",
    type: "screening",
    minAge: 50,
    maxAge: 71,
    sex: "female"
  },
  // vaccines
   {
    id: "flu-vaccine",
    name: "Flu vaccination",
    type: "vaccine",
    minAge: 65,
    maxAge: 120,
    sex: "all",
    otherEligibility: true
  }
]
