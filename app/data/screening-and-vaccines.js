/**
 * Screening and vaccine programme definitions
 *
 * Each programme defines:
 * - who it's for (eligibility)
 * - when it's needed (schedule)
 * - a description of what it is
 *
 * Display text is generated automatically by the eligibility engine
 * based on programme type and schedule. Only add a `messages` object
 * when you need to override the default text for a specific status.
 *
 * Eligibility conditions use three states:
 * - true:  confirmed (e.g. GP record says they have diabetes)
 * - false: confirmed negative (e.g. confirmed not pregnant)
 * - undefined/missing: we don't know — show as "unknown"
 */

module.exports = [

  // -------------------------------------------------------
  // Screening - all
  // -------------------------------------------------------

  {
    id: "bowel-cancer",
    name: "Bowel cancer screening",
    type: "screening",
    description: "A home test kit to check for early signs of bowel cancer.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 50, max: 74 },
      sex: "all"
    },

    schedule: {
      type: "recurring",
      intervalYears: 2
    }
  },

  {
    id: "breast-cancer",
    name: "Breast cancer screening",
    type: "screening",
    description: "A mammogram to check for early signs of breast cancer.",
    settings: ["hospital", "clinic"],

    eligibility: {
      age: { min: 50, max: 71 },
      sex: "female"
    },

    schedule: {
      type: "recurring",
      intervalYears: 3
    }
  },

  {
    id: "cervical-screening",
    name: "Cervical screening",
    type: "screening",
    description: "A test to check for changes in cells that could lead to cervical cancer.",
    settings: ["gp-surgery", "clinic"],

    eligibility: {
      age: { min: 25, max: 64 },
      sex: "female"
    },

    schedule: {
      type: "recurring",
      intervalYears: 5
    }
  },

  {
    id: "lung-screening",
    name: "Lung cancer screening",
    type: "screening",
    description: "A low-dose CT scan to check for early signs of lung cancer.",
    settings: ["hospital"],

    eligibility: {
      age: { min: 55, max: 74 },
      sex: "all",
      conditions: {
        mode: "or",
        required: ["smoker", "exSmoker"]
      }
    },

    schedule: {
      type: "recurring",
      intervalYears: 2
    },

    messages: {
      checkEligibility: "You may be eligible for lung cancer screening. Check with your GP."
    }
  },

  {
    id: "diabetic-eye-screening",
    name: "Diabetic eye screening",
    type: "screening",
    description: "A check for damage to the back of your eyes caused by diabetes.",
    settings: ["hospital", "clinic"],

    eligibility: {
      age: { min: 12, max: null },
      sex: "all",
      conditions: {
        mode: "and",
        required: ["diabetes"]
      }
    },

    schedule: {
      type: "recurring",
      intervalYears: 1
    }
  },

  {
    id: "aaa-screening",
    name: "Abdominal aortic aneurysm (AAA) screening",
    type: "screening",
    description: "A one-off ultrasound scan to check for a swelling in the main blood vessel in your tummy.",
    settings: ["hospital"],

    eligibility: {
      age: { min: 65, max: 65 },
      sex: "male"
    },

    schedule: {
      type: "one-off"
    }
  },

  // -------------------------------------------------------
  // Vaccines — babies (routine)
  // -------------------------------------------------------

  {
    id: "6-in-1-vaccine",
    name: "6-in-1 vaccine",
    type: "vaccine",
    description: "Protects against diphtheria, hepatitis B, Hib, polio, tetanus and whooping cough.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 3,
      timing: "8, 12 and 16 weeks"
    }
  },

  {
    id: "menb-vaccine",
    name: "MenB vaccine",
    type: "vaccine",
    description: "Protects against meningococcal group B bacteria.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 3,
      timing: "8 and 12 weeks, then booster at 1 year"
    }
  },

  {
    id: "rotavirus-vaccine",
    name: "Rotavirus vaccine",
    type: "vaccine",
    description: "Protects against rotavirus infection, a common cause of diarrhoea and sickness.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 0, max: 0 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 2,
      timing: "8 and 12 weeks"
    }
  },

  {
    id: "pcv-vaccine",
    name: "Pneumococcal (PCV) vaccine",
    type: "vaccine",
    description: "Protects against pneumococcal infections.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 2,
      timing: "16 weeks, then booster at 1 year"
    }
  },

  {
    id: "mmr-vaccine",
    name: "MMR vaccine",
    type: "vaccine",
    description: "Protects against measles, mumps and rubella.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 1, max: 5 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 2,
      timing: "1 year, then 3 years 4 months"
    }
  },

  {
    id: "preschool-booster",
    name: "Pre-school booster (dTaP/IPV)",
    type: "vaccine",
    description: "A single dose to boost protection against diphtheria, tetanus, whooping cough and polio.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 3, max: 5 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  // -------------------------------------------------------
  // Vaccines — school age
  // -------------------------------------------------------

  {
    id: "flu-vaccine-child",
    name: "Flu vaccine (children)",
    type: "vaccine",
    description: "A nasal spray given each autumn.",
    settings: ["gp-surgery", "pharmacy"],

    eligibility: {
      age: { min: 2, max: 16 },
      sex: "all"
    },

    schedule: {
      type: "recurring",
      intervalYears: 1
    }
  },

  {
    id: "hpv-vaccine",
    name: "HPV vaccine",
    type: "vaccine",
    description: "Protects against cancers caused by HPV. Usually given in Year 8.",
    settings: ["gp-surgery", "clinic"],

    eligibility: {
      age: { min: 12, max: 25 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "teenage-booster",
    name: "Teenage booster (Td/IPV)",
    type: "vaccine",
    description: "Boosts protection against tetanus, diphtheria and polio. Given in Year 9.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 14, max: 14 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "menacwy-vaccine",
    name: "MenACWY vaccine",
    type: "vaccine",
    description: "Protects against meningitis and septicaemia. Usually given in Year 9.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 14, max: 25 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  // -------------------------------------------------------
  // Vaccines — adults
  // -------------------------------------------------------

  {
    id: "flu-vaccine",
    name: "Flu vaccine",
    type: "vaccine",
    description: "An annual vaccine, usually available from autumn.",
    settings: ["gp-surgery", "pharmacy"],

    eligibility: {
      age: { min: 65, max: null },
      sex: "all",
      conditions: {
        mode: "or",
        required: ["clinicalRiskGroup", "carer", "pregnant", "immunosuppressed"]
      }
    },

    schedule: {
      type: "recurring",
      intervalYears: 1
    },

    messages: {
      checkEligibility: "You may be eligible for a free flu vaccine. Check with your GP."
    }
  },

  {
    id: "pneumococcal-vaccine",
    name: "Pneumococcal vaccine (PPV23)",
    type: "vaccine",
    description: "A one-off vaccine to protect against pneumococcal infections.",
    settings: ["gp-surgery", "pharmacy"],

    eligibility: {
      age: { min: 65, max: null },
      sex: "all",
      conditions: {
        mode: "or",
        required: ["clinicalRiskGroup", "immunosuppressed"]
      }
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      checkEligibility: "You may be eligible for a free pneumococcal vaccine. Check with your GP."
    }
  },

  {
    id: "shingles-vaccine",
    name: "Shingles vaccine",
    type: "vaccine",
    description: "2 doses to protect against shingles, given 6 months apart.",
    settings: ["gp-surgery", "pharmacy"],

    eligibility: {
      age: { min: 65, max: 80 },
      sex: "all",
      conditions: {
        mode: "or",
        required: ["immunosuppressed"]
      }
    },

    schedule: {
      type: "multi-dose",
      doses: 2,
      timing: "2 doses, 6 months apart"
    },

    messages: {
      checkEligibility: "You may be eligible for the shingles vaccine. Check with your GP."
    }
  },

  {
    id: "rsv-vaccine",
    name: "RSV vaccine",
    type: "vaccine",
    description: "A one-off vaccine to protect against respiratory syncytial virus.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 75, max: null },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "covid-vaccine",
    name: "COVID-19 vaccine",
    type: "vaccine",
    description: "A seasonal vaccine, usually available from autumn.",
    settings: ["gp-surgery", "pharmacy"],

    eligibility: {
      age: { min: 75, max: null },
      sex: "all",
      conditions: {
        mode: "or",
        required: ["immunosuppressed", "careHomeResident"]
      }
    },

    schedule: {
      type: "recurring",
      intervalYears: 1
    },

    messages: {
      checkEligibility: "You may be eligible for a COVID-19 vaccine. Check with your GP."
    }
  },

  // -------------------------------------------------------
  // Vaccines — pregnancy
  // -------------------------------------------------------

  {
    id: "flu-vaccine-pregnancy",
    name: "Flu vaccine (pregnancy)",
    type: "vaccine",
    description: "Recommended during pregnancy to protect you and your baby.",
    settings: ["gp-surgery", "pharmacy"],

    eligibility: {
      age: { min: 16, max: 50 },
      sex: "female",
      conditions: {
        mode: "and",
        required: ["pregnant"]
      }
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      complete: "Given during this pregnancy"
    }
  },

  {
    id: "whooping-cough-vaccine-pregnancy",
    name: "Whooping cough vaccine (Tdap)",
    type: "vaccine",
    description: "Recommended from 16 weeks of pregnancy to protect your baby.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 16, max: 50 },
      sex: "female",
      conditions: {
        mode: "and",
        required: ["pregnant"]
      }
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      complete: "Given during this pregnancy"
    }
  },

  {
    id: "rsv-vaccine-pregnancy",
    name: "RSV vaccine (pregnancy)",
    type: "vaccine",
    description: "Recommended from 28 weeks of pregnancy to protect your baby against RSV.",
    settings: ["gp-surgery"],

    eligibility: {
      age: { min: 16, max: 50 },
      sex: "female",
      conditions: {
        mode: "and",
        required: ["pregnant"]
      }
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      complete: "Given during this pregnancy"
    }
  }
]
