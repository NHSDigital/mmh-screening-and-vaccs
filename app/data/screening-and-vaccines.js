module.exports = [
  // screening
  {
    id: "bowel-cancer",
    name: "Bowel cancer screening",
    type: "screening",
    minAge: 50,
    maxAge: 74,
    sex: "all",
    schedule: { intervalYears: 2 },
    scheduleDescription: "Every 2 years"
  },
  {
    id: "breast-cancer",
    name: "Breast cancer screening",
    type: "screening",
    minAge: 50,
    maxAge: 71,
    sex: "female",
    schedule: { intervalYears: 3 },
    scheduleDescription: "Every 3 years"
  },
  {
    id: "cervical-screening",
    name: "Cervical screening",
    type: "screening",
    minAge: 25,
    maxAge: 64,
    sex: "female",
    schedule: { intervalYears: 5 },
    scheduleDescription: "Every 5 years"
  },
  {
    id: "lung-screening",
    name: "Lung cancer screening",
    type: "screening",
    minAge: 55,
    maxAge: 74,
    sex: "all",
    schedule: { intervalYears: 2 },
    scheduleDescription: "Every 2 years if high risk",
    otherEligibility: {
      mode: "or",
      conditions: ["smoker", "exSmoker"]
    }
  },
  {
    id: "diabetic-eye-screening",
    name: "Diabetic eye screening",
    type: "screening",
    minAge: 12,
    maxAge: null,
    sex: "all",
    schedule: { intervalYears: 1 },
    scheduleDescription: "Annual, or every 2 years if low risk",
    otherEligibility: {
      mode: "and",
      conditions: ["diabetes"]
    }
  },
  {
    id: "aaa-screening",
    name: "Abdominal aortic aneurysm screening",
    type: "screening",
    minAge: 65,
    maxAge: 65,
    sex: "male",
    schedule: {},
    scheduleDescription: "One-time at age 65"
  },

  // vaccines - babies (routine)
  {
    id: "6-in-1-vaccine",
    name: "6-in-1 vaccine",
    type: "vaccine",
    minAge: 0,
    maxAge: 1,
    sex: "all",
    schedule: { doses: 3 },
    scheduleDescription: "3 doses at 8, 12 and 16 weeks"
  },
  {
    id: "menb-vaccine",
    name: "MenB vaccine",
    type: "vaccine",
    minAge: 0,
    maxAge: 1,
    sex: "all",
    schedule: { doses: 3 },
    scheduleDescription: "8 and 12 weeks, then booster at 1 year"
  },
  {
    id: "rotavirus-vaccine",
    name: "Rotavirus vaccine",
    type: "vaccine",
    minAge: 0,
    maxAge: 0,
    sex: "all",
    schedule: { doses: 2 },
    scheduleDescription: "2 doses at 8 and 12 weeks"
  },
  {
    id: "pcv-vaccine",
    name: "Pneumococcal (PCV) vaccine",
    type: "vaccine",
    minAge: 0,
    maxAge: 1,
    sex: "all",
    schedule: { doses: 2 },
    scheduleDescription: "16 weeks, then booster at 1 year"
  },
  {
    id: "mmr-vaccine",
    name: "MMR vaccine",
    type: "vaccine",
    minAge: 1,
    maxAge: 5,
    sex: "all",
    schedule: { doses: 2 },
    scheduleDescription: "1 year, then 3 years 4 months"
  },
  {
    id: "preschool-booster",
    name: "Pre-school booster (dTaP/IPV)",
    type: "vaccine",
    minAge: 3,
    maxAge: 5,
    sex: "all",
    schedule: {},
    scheduleDescription: "Single dose at 3 years 4 months"
  },

  // vaccines - school age
  {
    id: "flu-vaccine-child",
    name: "Flu vaccine (children)",
    type: "vaccine",
    minAge: 2,
    maxAge: 16,
    sex: "all",
    schedule: { intervalYears: 1 },
    scheduleDescription: "Annual (nasal spray)"
  },
  {
    id: "hpv-vaccine",
    name: "HPV vaccine",
    type: "vaccine",
    minAge: 12,
    maxAge: 25,
    sex: "all",
    schedule: {},
    scheduleDescription: "Single dose in Year 8"
  },
  {
    id: "teenage-booster",
    name: "Teenage booster (Td/IPV)",
    type: "vaccine",
    minAge: 14,
    maxAge: 14,
    sex: "all",
    schedule: {},
    scheduleDescription: "Single dose in Year 9"
  },
  {
    id: "menacwy-vaccine",
    name: "MenACWY vaccine",
    type: "vaccine",
    minAge: 14,
    maxAge: 25,
    sex: "all",
    schedule: {},
    scheduleDescription: "Single dose in Year 9"
  },

  // vaccines - adults
  {
    id: "flu-vaccine",
    name: "Flu vaccine",
    type: "vaccine",
    minAge: 65,
    maxAge: null,
    sex: "all",
    schedule: { intervalYears: 1 },
    scheduleDescription: "Annual (autumn)",
    otherEligibility: {
      mode: "or",
      conditions: ["clinicalRiskGroup", "carer", "pregnant", "immunosuppressed"]
    }
  },
  {
    id: "pneumococcal-vaccine",
    name: "Pneumococcal vaccine (PPV23)",
    type: "vaccine",
    minAge: 65,
    maxAge: null,
    sex: "all",
    schedule: {},
    scheduleDescription: "One-time at 65",
    otherEligibility: {
      mode: "or",
      conditions: ["clinicalRiskGroup", "immunosuppressed"]
    }
  },
  {
    id: "shingles-vaccine",
    name: "Shingles vaccine",
    type: "vaccine",
    minAge: 65,
    maxAge: 80,
    sex: "all",
    schedule: { doses: 2 },
    scheduleDescription: "2 doses, 6 months apart",
    otherEligibility: {
      mode: "or",
      conditions: ["immunosuppressed"]
    }
  },
  {
    id: "rsv-vaccine",
    name: "RSV vaccine",
    type: "vaccine",
    minAge: 75,
    maxAge: null,
    sex: "all",
    schedule: {},
    scheduleDescription: "One-time at 75"
  },
  {
    id: "covid-vaccine",
    name: "COVID-19 vaccine",
    type: "vaccine",
    minAge: 75,
    maxAge: null,
    sex: "all",
    schedule: { intervalYears: 1 },
    scheduleDescription: "Seasonal (autumn)",
    otherEligibility: {
      mode: "or",
      conditions: ["immunosuppressed", "careHomeResident"]
    }
  },

  // vaccines - pregnancy
  {
    id: "flu-vaccine-pregnancy",
    name: "Flu vaccine (pregnancy)",
    type: "vaccine",
    minAge: 16,
    maxAge: 50,
    sex: "female",
    schedule: {},
    scheduleDescription: "Once per pregnancy",
    otherEligibility: {
      mode: "and",
      conditions: ["pregnant"]
    }
  },
  {
    id: "whooping-cough-vaccine-pregnancy",
    name: "Whooping cough vaccine (Tdap)",
    type: "vaccine",
    minAge: 16,
    maxAge: 50,
    sex: "female",
    schedule: {},
    scheduleDescription: "Once per pregnancy, from 16 weeks",
    otherEligibility: {
      mode: "and",
      conditions: ["pregnant"]
    }
  },
  {
    id: "rsv-vaccine-pregnancy",
    name: "RSV vaccine (pregnancy)",
    type: "vaccine",
    minAge: 16,
    maxAge: 50,
    sex: "female",
    schedule: {},
    scheduleDescription: "Once per pregnancy, from 28 weeks",
    otherEligibility: {
      mode: "and",
      conditions: ["pregnant"]
    }
  }
]
