module.exports = [
  {
    // Margaret – demo persona showing as many states as possible
    // History lastDate: past = done, future = booked appointment
    id: "Margaret",
    lastName: "Davies",
    dateOfBirth: "1960-03-15", // 65 years old
    sex: "female",
    nominatedGpSurgery: "ranworth-surgery",
    nominatedPharmacy: "pier-avenue-pharmacy",

    conditions: {
      diabetes: true,           // confirmed — triggers diabetic eye screening
      smoker: undefined,        // don't know – triggers lung check
      exSmoker: undefined,      // don't know – triggers lung check
      pregnant: undefined,      //
      clinicalRiskGroup: true,  // confirmed — triggers flu, pneumococcal
      carer: undefined,         // don't know
      immunosuppressed: true,   // confirmed — triggers flu, pneumococcal, shingles, COVID
      careHomeResident: false   // confirmed
    },

    history: {
      // COMPLETE — recently done, not due yet
      "bowel-cancer":            { lastDate: "2025-01-10" },
      "flu-vaccine":             { lastDate: "2024-10-05" },

      // BOOKED — future date means appointment is booked
      "breast-cancer":           { lastDate: "2026-03-10" },

      // DUE — interval has passed
      "diabetic-eye-screening":  { lastDate: "2024-01-20" },

      // DUE — never had (no entry = never had)
      // "pneumococcal-vaccine": — missing, so treated as never had
      // "lung-screening":       — missing, so treated as never had

      // Shingles dose 1 done, dose 2 not yet
      "shingles-vaccine-1":      { lastDate: "2024-09-01" },

      // OPTED OUT
      "cervical-screening":      { optedOut: true },
      "covid-vaccine":           { optedOut: true }
    }
  },

  {
    // Raam – young man with diabetes
    id: "Raam",
    lastName: "Sharma",
    dateOfBirth: "2000-07-22", // 25 years old
    sex: "male",
    nominatedGpSurgery: "st-james-surgery",
    nominatedPharmacy: "north-road-pharmacy",

    conditions: {
      diabetes: true,            // confirmed
      smoker: false,             // confirmed
      exSmoker: false,           // confirmed
      pregnant: false,           // n/a but set for consistency
      clinicalRiskGroup: true,   // confirmed (because of diabetes)
      carer: undefined,          // don't know
      immunosuppressed: false,   // confirmed
      careHomeResident: false    // confirmed
    },

    history: {
      "diabetic-eye-screening":  { lastDate: "2025-01-10" },
      "flu-vaccine":             { lastDate: "2024-10-12" }
    }
  },

  {
    // Amelia – healthy 35-year-old with children
    id: "Amelia",
    lastName: "Johnson",
    dateOfBirth: "1990-11-08", // 35 years old
    sex: "female",
    nominatedGpSurgery: "old-road-medical-practice",
    nominatedPharmacy: "prescription-2-you",

    conditions: {
      diabetes: false,
      smoker: undefined,              // don't know
      exSmoker: undefined,            // don't know,
      pregnant: undefined,            // don't know
      clinicalRiskGroup: undefined,   // don't know
      carer: undefined,               // don't know
      immunosuppressed: undefined,    // don't know
      careHomeResident: undefined     // don't know
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
          "6-in-1-vaccine-1":    { lastDate: "2023-01-15" },
          "6-in-1-vaccine-2":    { lastDate: "2023-01-15" },
          "6-in-1-vaccine-3":    { lastDate: "2023-01-15" },
          "rotavirus-vaccine-1": { lastDate: "2022-12-20" },
          "rotavirus-vaccine-2": { lastDate: "2022-12-20" },
          "menb-vaccine-1":      { lastDate: "2023-08-20" },
          "menb-vaccine-2":      { lastDate: "2023-08-20" },
          "menb-vaccine-3":      { lastDate: "2023-08-20" },
          "pcv-vaccine-1":       { lastDate: "2023-08-20" },
          "pcv-vaccine-2":       { lastDate: "2023-08-20" },
          "mmr-vaccine-1":       { lastDate: "2023-08-25" },
          "flu-vaccine-child":   { lastDate: "2024-10-01" }
        }
      },
      {
        id: "Rachel",
        lastName: "Johnson",
        dateOfBirth: "2025-06-10", // 8 months old
        sex: "female",

        conditions: {
          diabetes: false,
          clinicalRiskGroup: false,
          immunosuppressed: false
        },

        history: {
          "6-in-1-vaccine-1":    { lastDate: "2025-08-05" },
          "6-in-1-vaccine-2":    { lastDate: "2025-09-16" },
          "menb-vaccine-1":      { lastDate: "2025-08-05" },
          "rotavirus-vaccine-1": { lastDate: "2025-08-05" }
        }
      }
    ]
  }
]
