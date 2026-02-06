// personas.js
module.exports = [
  {
    // Margaret is a demo persona designed to show as many states as possible
    id: "Margaret",
    lastName: "Davies",
    dateOfBirth: "1960-03-15", // 65 years old
    sex: "female",

    // health conditions - enabled to show more eligibility
    diabetes: true, // Diabetic eye screening
    smoker: false, // Lung cancer screening
    exSmoker: true, // Lung cancer screening (ex-smoker eligible)
    pregnant: false, // Flu, whooping cough, RSV vaccines

    // vaccine eligibility - enabled to show more eligibility
    clinicalRiskGroup: true, // Flu, pneumococcal vaccines (due to diabetes)
    carer: false, // Flu vaccine
    immunosuppressed: true, // Flu, pneumococcal, shingles, COVID vaccines
    careHomeResident: false, // COVID vaccine

    // screening and vaccination history demonstrating all states:
    // - complete: has lastDate and not yet due
    // - due: no history OR interval has passed
    // - partial: multi-dose vaccine with incomplete doses
    // - opted-out: explicitly declined
    history: {
      // COMPLETE - recently done, not due yet
      "bowel-cancer": { lastDate: "2025-01-10" }, // Every 2 years, due 2027
      "flu-vaccine": { lastDate: "2024-10-05" }, // Annual, due autumn 2025
      "covid-vaccine": { optedOut: true },

      // DUE - interval has passed
      "breast-cancer": { lastDate: "2021-06-15" }, // Every 3 years, overdue since 2024
      "diabetic-eye-screening": { lastDate: "2024-01-20" }, // Annual, overdue

      // DUE - never had (no history entry)
      // pneumococcal-vaccine: one-time, never had
      // lung-screening: eligible as ex-smoker, never had

      // PARTIAL - multi-dose vaccine incomplete
      "shingles-vaccine": { lastDate: "2024-09-01", doses: 1 }, // Needs 2 doses, only had 1

      // OPTED OUT
      "cervical-screening": { optedOut: true }
    }
  },
  {
    id: "Raam",
    lastName: "Sharma",
    dateOfBirth: "2000-07-22", // 25 years old
    sex: "male",

    // health conditions
    diabetes: true, // Diabetic eye screening
    smoker: false, // Lung cancer screening
    exSmoker: false, // Lung cancer screening
    pregnant: false, // Flu, whooping cough, RSV vaccines

    // vaccine eligibility
    clinicalRiskGroup: true, // Flu, pneumococcal vaccines (true because diabetes)
    carer: false, // Flu vaccine
    immunosuppressed: false, // Flu, pneumococcal, shingles, COVID vaccines
    careHomeResident: false, // COVID vaccine

    // screening and vaccination history (lastDate implies completed)
    history: {
      "diabetic-eye-screening": { lastDate: "2025-01-10" }, // Annual, due 2026
      "flu-vaccine": { lastDate: "2024-10-12" } // Annual, due autumn 2025
    }
  },
  {
    id: "Amelia",
    lastName: "Johnson",
    dateOfBirth: "1990-11-08", // 35 years old
    sex: "female",

    // health conditions
    diabetes: false, // Diabetic eye screening
    smoker: false, // Lung cancer screening
    exSmoker: false, // Lung cancer screening
    pregnant: false, // Flu, whooping cough, RSV vaccines

    // vaccine eligibility
    clinicalRiskGroup: false, // Flu, pneumococcal vaccines
    carer: false, // Flu vaccine
    immunosuppressed: false, // Flu, pneumococcal, shingles, COVID vaccines
    careHomeResident: false, // COVID vaccine

    // screening and vaccination history (lastDate implies completed)
    history: {
      "cervical-screening": { lastDate: "2020-03-15" } // 5 year interval, overdue
    },

    proxies: [
      {
        id: "Ryan",
        lastName: "Johnson",
        dateOfBirth: "2022-08-20", // 3 years old
        sex: "male",

        // health conditions
        diabetes: false, // Diabetic eye screening
        clinicalRiskGroup: false, // Flu vaccine
        immunosuppressed: false, // Flu vaccine
        learningDisability: false, // Annual health check

        // vaccine eligibility
        highTbRiskArea: false, // BCG vaccine
        parentFromHighTbCountry: false, // BCG vaccine
        motherHepB: false, // Hepatitis B vaccine at birth

        // birth factors (may affect schedule timing)
        premature: false, // May affect vaccine schedule
        birthWeeksGestation: 40, // Used to calculate adjusted age for vaccines

        // vaccination history (lastDate implies completed, doses tracked for multi-dose vaccines)
        history: {
          "6-in-1-vaccine": { lastDate: "2023-01-15", doses: 3 },
          "rotavirus-vaccine": { lastDate: "2022-12-20", doses: 2 },
          "menb-vaccine": { lastDate: "2023-08-20", doses: 3 },
          "pcv-vaccine": { lastDate: "2023-08-20", doses: 2 },
          "mmr-vaccine": { lastDate: "2023-08-25", doses: 1 }, // Needs 2nd dose at 3y4m
          "flu-vaccine-child": { lastDate: "2024-10-01" } // Annual
        }
      }
    ]
  }
]
