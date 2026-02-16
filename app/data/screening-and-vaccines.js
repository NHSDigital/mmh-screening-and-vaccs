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
 *
 * Multi-dose vaccines are defined as separate programmes
 * (e.g. "shingles-vaccine-1", "shingles-vaccine-2").
 * Later doses use `eligibility.requires` to specify which
 * earlier doses must be completed first.
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
    overdueDays: 90,

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
    overdueDays: 90,

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
    overdueDays: 90,

    eligibility: {
      age: { min: 25, max: 64 },
      sex: "female",
      excludeConditions: ["pregnant"]
    },

    schedule: {
      type: "recurring",
      intervalYears: 5
    }
  },

  {
    id: "home-cervical-testing",
    name: "Home cervical testing",
    type: "screening",
    description: "A home test kit to check for early signs of cervical cancer.",
    settings: ["home"],
    overdueDays: 90,

    eligibility: {
      age: { min: 25, max: 64 },
      sex: "female",
      excludeConditions: ["pregnant"],
      requiresOptOut: "cervical-screening"
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
    overdueDays: 90,

    eligibility: {
      age: { min: 55, max: 74 },
      sex: "all",
      requireConditions: true,
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
      checkEligibility: "Check if you should get lung cancer screening."
    }
  },

  {
    id: "diabetic-eye-screening",
    name: "Diabetic eye screening",
    type: "screening",
    description: "A check for damage to the back of your eyes caused by diabetes.",
    settings: ["hospital", "clinic"],
    overdueDays: 90,

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
    overdueDays: 90,

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
    id: "6-in-1-vaccine-1",
    name: "6-in-1 vaccine – dose 1 of 3",
    type: "vaccine",
    description: "Protects against diphtheria, hepatitis B, Hib, polio, tetanus and whooping cough. Usually given at 8 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "6-in-1-vaccine-2",
    name: "6-in-1 vaccine – dose 2 of 3",
    type: "vaccine",
    description: "Protects against diphtheria, hepatitis B, Hib, polio, tetanus and whooping cough. Usually given at 12 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all",
      requires: ["6-in-1-vaccine-1"]
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "6-in-1-vaccine-3",
    name: "6-in-1 vaccine – dose 3 of 3",
    type: "vaccine",
    description: "Protects against diphtheria, hepatitis B, Hib, polio, tetanus and whooping cough. Usually given at 16 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all",
      requires: ["6-in-1-vaccine-2"]
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "menb-vaccine-1",
    name: "Meningitis B vaccine – dose 1 of 3",
    type: "vaccine",
    description: "Protects against meningococcal group B bacteria. Usually given at 8 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "menb-vaccine-2",
    name: "Meningitis B vaccine – dose 2 of 3",
    type: "vaccine",
    description: "Protects against meningococcal group B bacteria. Usually given at 12 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all",
      requires: ["menb-vaccine-1"]
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "menb-vaccine-3",
    name: "Meningitis B vaccine – dose 3 of 3",
    type: "vaccine",
    description: "Protects against meningococcal group B bacteria. Booster, usually given at 1 year.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all",
      requires: ["menb-vaccine-2"]
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "rotavirus-vaccine-1",
    name: "Rotavirus vaccine – dose 1 of 2",
    type: "vaccine",
    description: "Protects against rotavirus infection, a common cause of diarrhoea and sickness. Usually given at 8 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 0 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "rotavirus-vaccine-2",
    name: "Rotavirus vaccine – dose 2 of 2",
    type: "vaccine",
    description: "Protects against rotavirus infection, a common cause of diarrhoea and sickness. Usually given at 12 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 0 },
      sex: "all",
      requires: ["rotavirus-vaccine-1"]
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "pcv-vaccine-1",
    name: "Pneumococcal vaccine – dose 1 of 2",
    type: "vaccine",
    description: "Protects against pneumococcal infections. Usually given at 16 weeks.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "pcv-vaccine-2",
    name: "Pneumococcal vaccine – dose 2 of 2",
    type: "vaccine",
    description: "Protects against pneumococcal infections. Booster, usually given at 1 year.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all",
      requires: ["pcv-vaccine-1"]
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "mmr-vaccine-1",
    name: "MMR vaccine – dose 1 of 2",
    type: "vaccine",
    walkIn: true,
    description: "Protects against measles, mumps and rubella. Usually given at 1 year.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 1, max: 5 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "mmr-vaccine-2",
    name: "MMR vaccine – dose 2 of 2",
    type: "vaccine",
    walkIn: true,
    description: "Protects against measles, mumps and rubella. Usually given at 3 years 4 months.",
    settings: ["gp-surgery"],
    overdueDays: 90,

    eligibility: {
      age: { min: 1, max: 5 },
      sex: "all",
      requires: ["mmr-vaccine-1"]
    },

    schedule: {
      type: "one-off"
    }
  },

  {
    id: "preschool-booster",
    name: "Pre-school booster (dTaP/IPV)",
    type: "vaccine",
    description: "A single dose to boost protection against diphtheria, tetanus, whooping cough and polio.",
    settings: ["gp-surgery"],
    overdueDays: 90,

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
    seasonalWindow: { start: "09-01", end: "03-31" },
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
    overdueDays: 90,

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
    name: "Teenage booster",
    type: "vaccine",
    description: "Boosts protection against tetanus, diphtheria and polio. Given in Year 9.",
    settings: ["gp-surgery"],
    overdueDays: 90,

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
    name: "Meningitiss, sepsis and septicaemia vaccine",
    type: "vaccine",
    description: "Protects against meningitis and septicaemia (blood poisoning). Usually given in Year 9.",
    settings: ["gp-surgery"],
    overdueDays: 90,

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
    seasonalWindow: { start: "09-01", end: "03-31" },
    walkIn: true,
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
      checkEligibility: "Check if you should get a flu vaccine."
    }
  },

  {
    id: "pneumococcal-vaccine",
    name: "Pneumococcal vaccine",
    type: "vaccine",
    walkIn: true,
    description: "A one-off vaccine to protect against pneumococcal infections.",
    settings: ["gp-surgery", "pharmacy"],
    overdueDays: 90,

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
      checkEligibility: "Check if you should get a pneumococcal vaccine."
    }
  },

  {
    id: "shingles-vaccine-1",
    name: "Shingles vaccine – dose 1 of 2",
    type: "vaccine",
    description: "Protects against shingles.",
    settings: ["gp-surgery", "pharmacy"],
    overdueDays: 90,

    eligibility: {
      age: { min: 65, max: 80 },
      sex: "all",
      conditions: {
        mode: "or",
        required: ["immunosuppressed"]
      }
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      checkEligibility: "Check if you should get the shingles vaccine."
    }
  },

  {
    id: "shingles-vaccine-2",
    name: "Shingles vaccine – dose 2 of 2",
    type: "vaccine",
    description: "Second dose, given 6 months after the first.",
    settings: ["gp-surgery", "pharmacy"],
    overdueDays: 90,

    eligibility: {
      age: { min: 65, max: 80 },
      sex: "all",
      conditions: {
        mode: "or",
        required: ["immunosuppressed"]
      },
      requires: ["shingles-vaccine-1"]
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      checkEligibility: "Check if you should get the shingles vaccine."
    }
  },

  {
    id: "rsv-vaccine",
    name: "RSV vaccine",
    type: "vaccine",
    walkIn: true,
    description: "A one-off vaccine to protect against respiratory syncytial virus.",
    settings: ["gp-surgery"],
    overdueDays: 90,

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
    seasonalWindow: { start: "09-01", end: "12-31" },
    walkIn: true,
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
      checkEligibility: "Check if you should get a COVID-19 vaccine."
    }
  },

  // -------------------------------------------------------
  // Vaccines — pregnancy
  // -------------------------------------------------------

  {
    id: "whooping-cough-vaccine-pregnancy",
    name: "Whooping cough vaccine",
    type: "vaccine",
    description: "Recommended from 16 weeks of pregnancy to protect your baby.",
    settings: ["gp-surgery"],
    overdueDays: 90,

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
    overdueDays: 90,

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
