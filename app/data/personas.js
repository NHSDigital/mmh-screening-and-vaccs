
module.exports = [
  {
    // Margaret: demo persona showing as many states as possible
    id: "Margaret",
    lastName: "Davies",
    dateOfBirth: "1960-03-15", // 65 years old
    sex: "female",

    conditions: {
      diabetes: true,           // confirmed — triggers diabetic eye screening
      smoker: false,            // confirmed not a current smoker
      exSmoker: true,           // confirmed — triggers lung screening
      pregnant: false,          // confirmed
      clinicalRiskGroup: true,  // confirmed — triggers flu, pneumococcal
      carer: undefined,         // we don’t know — should show "check eligibility" for flu
      immunosuppressed: true,   // confirmed — triggers flu, pneumococcal, shingles, COVID
      careHomeResident: false   // confirmed
    },

    history: {
      // COMPLETE — recently done, not due yet
      "bowel-cancer":            { lastDate: "2025-01-10" },
      "flu-vaccine":             { lastDate: "2024-10-05" },

      // DUE — interval has passed
      "breast-cancer":           { lastDate: "2021-06-15" },
      "diabetic-eye-screening":  { lastDate: "2024-01-20" },

      // DUE — never had (no entry = never had)
      // "pneumococcal-vaccine": — missing, so treated as never had
      // "lung-screening":       — missing, so treated as never had

      // PARTIAL — multi-dose incomplete
      "shingles-vaccine":        { lastDate: "2024-09-01", doses: 1 },

      // OPTED OUT
      "cervical-screening":      { optedOut: true },
      "covid-vaccine":           { optedOut: true }
    }
  },

  {
    // Raam: young man with diabetes
    id: "Raam",
    lastName: "Sharma",
    dateOfBirth: "2000-07-22", // 25 years old
    sex: "male",

    conditions: {
      diabetes: true,            // confirmed
      smoker: false,             // confirmed
      exSmoker: false,           // confirmed
      pregnant: false,           // n/a but set for consistency
      clinicalRiskGroup: true,   // confirmed (because of diabetes)
      carer: undefined,          // we don’t know
      immunosuppressed: false,   // confirmed
      careHomeResident: false    // confirmed
    },

    history: {
      "diabetic-eye-screening":  { lastDate: "2025-01-10" },
      "flu-vaccine":             { lastDate: "2024-10-12" }
    }
  },

  {
    // Amelia: healthy 35-year-old with a child
    id: "Amelia",
    lastName: "Johnson",
    dateOfBirth: "1990-11-08", // 35 years old
    sex: "female",

    conditions: {
      diabetes: false,
      smoker: false,
      exSmoker: false,
      pregnant: false,
      clinicalRiskGroup: false,
      carer: undefined,          // we don’t know
      immunosuppressed: false,
      careHomeResident: false
    },

    history: {
      "cervical-screening":      { lastDate: "2020-03-15" }
    },

    proxies: [
      {
        id: "Ryan",
        lastName: "Johnson",
        dateOfBirth: "2022-08-20", // 3 years old
        sex: "male",

        conditions: {
          diabetes: false,
          clinicalRiskGroup: false,
          immunosuppressed: false
        },

        history: {
          "6-in-1-vaccine":      { lastDate: "2023-01-15", doses: 3 },
          "rotavirus-vaccine":   { lastDate: "2022-12-20", doses: 2 },
          "menb-vaccine":        { lastDate: "2023-08-20", doses: 3 },
          "pcv-vaccine":         { lastDate: "2023-08-20", doses: 2 },
          "mmr-vaccine":         { lastDate: "2023-08-25", doses: 1 },
          "flu-vaccine-child":   { lastDate: "2024-10-01" }
        }
      }
    ]
  }
]
