/**
 * Screening and vaccine programme definitions
 *
 * Each programme defines:
 * - who it's for (eligibility)
 * - when it's needed (schedule)
 * - what to tell the user (messages)
 *
 * Eligibility conditions use three states:
 * - true:  confirmed (e.g. GP record says they have diabetes)
 * - false: confirmed negative (e.g. confirmed not pregnant)
 * - undefined/missing: we don't know — show "check if eligible"
 *
 * This matters because "we don't know if you're a carer" is
 * very different from "you're not a carer".
 */

module.exports = [

  // -------------------------------------------------------
  // Screening programmes
  // -------------------------------------------------------

  {
    id: "bowel-cancer",
    name: "Bowel cancer screening",
    type: "screening",

    eligibility: {
      age: { min: 50, max: 74 },
      sex: "all"
    },

    schedule: {
      type: "recurring",
      intervalYears: 2
    },

    messages: {
      due: "Book your bowel cancer screening",
      dueSub: "A home test kit to check for early signs of bowel cancer.",
      overdue: (overdueText) => `Your screening was due ${overdueText} ago`,
      upcoming: (dateText) => `Next screening due ${dateText}`,
      complete: (dateText) => `You had this ${dateText}`,
      neverHad: "You have not had this screening before"
    }
  },

  {
    id: "breast-cancer",
    name: "Breast cancer screening",
    type: "screening",

    eligibility: {
      age: { min: 50, max: 71 },
      sex: "female"
    },

    schedule: {
      type: "recurring",
      intervalYears: 3
    },

    messages: {
      due: "Book your breast screening",
      dueSub: "A mammogram to check for early signs of breast cancer.",
      overdue: (overdueText) => `Your screening was due ${overdueText} ago`,
      upcoming: (dateText) => `Next screening due ${dateText}`,
      complete: (dateText) => `You had this ${dateText}`,
      neverHad: "You have not had this screening before"
    }
  },

  {
    id: "cervical-screening",
    name: "Cervical screening",
    type: "screening",

    eligibility: {
      age: { min: 25, max: 64 },
      sex: "female"
    },

    schedule: {
      type: "recurring",
      intervalYears: 5
    },

    messages: {
      due: "Book your cervical screening",
      dueSub: "A test to check for changes in cells that could lead to cervical cancer.",
      overdue: (overdueText) => `Your screening was due ${overdueText} ago`,
      upcoming: (dateText) => `Next screening due ${dateText}`,
      complete: (dateText) => `You had this ${dateText}`,
      neverHad: "You have not had this screening before"
    }
  },

  {
    id: "lung-screening",
    name: "Lung cancer screening",
    type: "screening",

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
      due: "Book your lung cancer screening",
      dueSub: "A low-dose CT scan to check for early signs of lung cancer.",
      overdue: (overdueText) => `Your screening was due ${overdueText} ago`,
      upcoming: (dateText) => `Next screening due ${dateText}`,
      complete: (dateText) => `You had this ${dateText}`,
      neverHad: "You have not had this screening before",
      checkEligibility: "You may be eligible for lung cancer screening. Check with your GP."
    }
  },

  {
    id: "diabetic-eye-screening",
    name: "Diabetic eye screening",
    type: "screening",

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
    },

    messages: {
      due: "Book your diabetic eye screening",
      dueSub: "A check for damage to the back of your eyes caused by diabetes.",
      overdue: (overdueText) => `Your screening was due ${overdueText} ago`,
      upcoming: (dateText) => `Next screening due ${dateText}`,
      complete: (dateText) => `You had this ${dateText}`,
      neverHad: "You have not had this screening before"
    }
  },

  {
    id: "aaa-screening",
    name: "Abdominal aortic aneurysm (AAA) screening",
    type: "screening",

    eligibility: {
      age: { min: 65, max: 65 },
      sex: "male"
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      due: "Book your AAA screening",
      dueSub: "A one-off ultrasound scan to check for a swelling in the main blood vessel in your tummy.",
      complete: (dateText) => `You had this ${dateText}`,
      neverHad: "You have not had this screening before"
    }
  },

  // -------------------------------------------------------
  // Vaccines — babies (routine)
  // -------------------------------------------------------

  {
    id: "6-in-1-vaccine",
    name: "6-in-1 vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 3,
      timing: "8, 12 and 16 weeks"
    },

    messages: {
      due: "Book the 6-in-1 vaccine",
      dueSub: "Protects against diphtheria, hepatitis B, Hib, polio, tetanus and whooping cough.",
      partial: (given, total) => `${given} of ${total} doses given — book the next dose`,
      complete: "All doses given"
    }
  },

  {
    id: "menb-vaccine",
    name: "MenB vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 3,
      timing: "8 and 12 weeks, then booster at 1 year"
    },

    messages: {
      due: "Book the MenB vaccine",
      dueSub: "Protects against meningococcal group B bacteria.",
      partial: (given, total) => `${given} of ${total} doses given — book the next dose`,
      complete: "All doses given"
    }
  },

  {
    id: "rotavirus-vaccine",
    name: "Rotavirus vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 0, max: 0 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 2,
      timing: "8 and 12 weeks"
    },

    messages: {
      due: "Book the rotavirus vaccine",
      dueSub: "Protects against rotavirus infection, a common cause of diarrhoea and sickness.",
      partial: (given, total) => `${given} of ${total} doses given — book the next dose`,
      complete: "All doses given"
    }
  },

  {
    id: "pcv-vaccine",
    name: "Pneumococcal (PCV) vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 0, max: 1 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 2,
      timing: "16 weeks, then booster at 1 year"
    },

    messages: {
      due: "Book the PCV vaccine",
      dueSub: "Protects against pneumococcal infections.",
      partial: (given, total) => `${given} of ${total} doses given — book the next dose`,
      complete: "All doses given"
    }
  },

  {
    id: "mmr-vaccine",
    name: "MMR vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 1, max: 5 },
      sex: "all"
    },

    schedule: {
      type: "multi-dose",
      doses: 2,
      timing: "1 year, then 3 years 4 months"
    },

    messages: {
      due: "Book the MMR vaccine",
      dueSub: "Protects against measles, mumps and rubella.",
      partial: (given, total) => `${given} of ${total} doses given — book the next dose`,
      complete: "All doses given"
    }
  },

  {
    id: "preschool-booster",
    name: "Pre-school booster (dTaP/IPV)",
    type: "vaccine",

    eligibility: {
      age: { min: 3, max: 5 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      due: "Book the pre-school booster",
      dueSub: "A single dose to boost protection against diphtheria, tetanus, whooping cough and polio.",
      complete: "Given"
    }
  },

  // -------------------------------------------------------
  // Vaccines — school age
  // -------------------------------------------------------

  {
    id: "flu-vaccine-child",
    name: "Flu vaccine (children)",
    type: "vaccine",

    eligibility: {
      age: { min: 2, max: 16 },
      sex: "all"
    },

    schedule: {
      type: "recurring",
      intervalYears: 1
    },

    messages: {
      due: "Book the annual flu vaccine",
      dueSub: "A nasal spray given each autumn.",
      upcoming: (dateText) => `Next flu vaccine due ${dateText}`,
      complete: (dateText) => `Had this ${dateText}`
    }
  },

  {
    id: "hpv-vaccine",
    name: "HPV vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 12, max: 25 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      due: "Book the HPV vaccine",
      dueSub: "Protects against cancers caused by HPV. Usually given in Year 8.",
      complete: "Given"
    }
  },

  {
    id: "teenage-booster",
    name: "Teenage booster (Td/IPV)",
    type: "vaccine",

    eligibility: {
      age: { min: 14, max: 14 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      due: "Book the teenage booster",
      dueSub: "Boosts protection against tetanus, diphtheria and polio. Given in Year 9.",
      complete: "Given"
    }
  },

  {
    id: "menacwy-vaccine",
    name: "MenACWY vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 14, max: 25 },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      due: "Book the MenACWY vaccine",
      dueSub: "Protects against meningitis and septicaemia. Usually given in Year 9.",
      complete: "Given"
    }
  },

  // -------------------------------------------------------
  // Vaccines — adults
  // -------------------------------------------------------

  {
    id: "flu-vaccine",
    name: "Flu vaccine",
    type: "vaccine",

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
      due: "Book your flu vaccine",
      dueSub: "An annual vaccine, usually available from autumn.",
      upcoming: (dateText) => `Next flu vaccine due ${dateText}`,
      complete: (dateText) => `You had this ${dateText}`,
      checkEligibility: "You may be eligible for a free flu vaccine. Check with your GP."
    }
  },

  {
    id: "pneumococcal-vaccine",
    name: "Pneumococcal vaccine (PPV23)",
    type: "vaccine",

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
      due: "Book your pneumococcal vaccine",
      dueSub: "A one-off vaccine to protect against pneumococcal infections.",
      complete: (dateText) => `You had this ${dateText}`,
      checkEligibility: "You may be eligible for a free pneumococcal vaccine. Check with your GP."
    }
  },

  {
    id: "shingles-vaccine",
    name: "Shingles vaccine",
    type: "vaccine",

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
      due: "Book your shingles vaccine",
      dueSub: "2 doses to protect against shingles, given 6 months apart.",
      partial: (given, total) => `${given} of ${total} doses given`,
      complete: "All doses given",
      checkEligibility: "You may be eligible for the shingles vaccine. Check with your GP."
    }
  },

  {
    id: "rsv-vaccine",
    name: "RSV vaccine",
    type: "vaccine",

    eligibility: {
      age: { min: 75, max: null },
      sex: "all"
    },

    schedule: {
      type: "one-off"
    },

    messages: {
      due: "Book your RSV vaccine",
      dueSub: "A one-off vaccine to protect against respiratory syncytial virus.",
      complete: (dateText) => `You had this ${dateText}`
    }
  },

  {
    id: "covid-vaccine",
    name: "COVID-19 vaccine",
    type: "vaccine",

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
      due: "Book your COVID-19 vaccine",
      dueSub: "A seasonal vaccine, usually available from autumn.",
      upcoming: (dateText) => `Next COVID vaccine due ${dateText}`,
      complete: (dateText) => `You had this ${dateText}`,
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
      due: "Book your flu vaccine",
      dueSub: "Recommended during pregnancy to protect you and your baby.",
      complete: "Given during this pregnancy"
    }
  },

  {
    id: "whooping-cough-vaccine-pregnancy",
    name: "Whooping cough vaccine (Tdap)",
    type: "vaccine",

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
      due: "Book your whooping cough vaccine",
      dueSub: "Recommended from 16 weeks of pregnancy to protect your baby.",
      complete: "Given during this pregnancy"
    }
  },

  {
    id: "rsv-vaccine-pregnancy",
    name: "RSV vaccine (pregnancy)",
    type: "vaccine",

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
      due: "Book your RSV vaccine",
      dueSub: "Recommended from 28 weeks of pregnancy to protect your baby against RSV.",
      complete: "Given during this pregnancy"
    }
  }
]
