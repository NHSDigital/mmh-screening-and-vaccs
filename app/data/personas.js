// personas.js
module.exports = [
  {
    id: "Margaret",
    lastName: "Davies",
    dateOfBirth: "1960-03-15", // 65 years old
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

    // screening and vaccination history
    history: {
      "breast-cancer": { lastDate: "2024-06-10", status: "complete" }, // Due again 2027
      "cervical-screening": { lastDate: "2022-01-20", status: "complete" }, // Due again 2027
      "bowel-cancer": { lastDate: "2024-02-15", status: "complete" }, // Due again 2026
      "flu-vaccine": { lastDate: "2024-10-05", status: "complete" } // Annual, due autumn 2025
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

    // screening and vaccination history
    history: {
      "diabetic-eye-screening": { lastDate: "2025-01-10", status: "complete" }, // Annual, due 2026
      "flu-vaccine": { lastDate: "2024-10-12", status: "complete" } // Annual, due autumn 2025
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

    // screening and vaccination history
    history: {
      "cervical-screening": { lastDate: "2020-03-15", status: "complete" } // 5 year interval, overdue
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

        // vaccination history
        history: {
          "6-in-1-vaccine": { lastDate: "2023-01-15", status: "complete", doses: 3 },
          "rotavirus-vaccine": { lastDate: "2022-12-20", status: "complete", doses: 2 },
          "menb-vaccine": { lastDate: "2023-08-20", status: "complete", doses: 3 },
          "pcv-vaccine": { lastDate: "2023-08-20", status: "complete", doses: 2 },
          "mmr-vaccine": { lastDate: "2023-08-25", status: "partial", doses: 1 }, // Needs 2nd dose at 3y4m
          "flu-vaccine-child": { lastDate: "2024-10-01", status: "complete" } // Annual
        }
      }
    ]
  }
]
