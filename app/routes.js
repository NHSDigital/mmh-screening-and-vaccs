// External dependencies
const express = require('express');

const router = express.Router();

const programmes = require('./data/screening-and-vaccines')
const personas = require('./data/personas')

// Get today's date (can be overridden for testing)
function getToday () {
  return new Date()
}

// Calculate age from date of birth
function calculateAge (dateOfBirth, today = getToday()) {
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// Check if person meets age requirements
function checkAge (person, prog, today = getToday()) {
  const age = person.dateOfBirth ? calculateAge(person.dateOfBirth, today) : person.age
  const aboveMin = age >= prog.minAge
  const belowMax = prog.maxAge === null || age <= prog.maxAge
  return aboveMin && belowMax
}

// Check if a programme is due based on last completion date and interval
function checkIfDue (person, prog, today = getToday()) {
  const history = person.history && person.history[prog.id]

  // No history - due if eligible
  if (!history) {
    return { isDue: true, hasHistory: false, lastDate: null, nextDueDate: null }
  }

  // Opted out
  if (history.optedOut) {
    return { isOptedOut: true, hasHistory: true }
  }

  // Has history entry but no lastDate - due if eligible
  if (!history.lastDate) {
    return { isDue: true, hasHistory: false, lastDate: null, nextDueDate: null }
  }

  const lastDate = new Date(history.lastDate)
  const requiredDoses = prog.schedule.doses || 1
  const givenDoses = history.doses || 1
  const isPartial = givenDoses < requiredDoses

  // Multi-dose vaccines that aren't complete yet
  if (isPartial) {
    return {
      isDue: true,
      isPartial: true,
      hasHistory: true,
      lastDate: history.lastDate,
      nextDueDate: null,
      doses: givenDoses,
      requiredDoses
    }
  }

  // Calculate next due date if intervalYears exists, otherwise one-time (not due again)
  let nextDueDate = null
  let overdueBy = null

  if (prog.schedule.intervalYears) {
    nextDueDate = new Date(lastDate)
    nextDueDate.setFullYear(nextDueDate.getFullYear() + prog.schedule.intervalYears)

    // Calculate how overdue if past due date
    if (today >= nextDueDate) {
      const diffTime = today - nextDueDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      overdueBy = { days: diffDays }
    }
  }

  const isDue = nextDueDate ? today >= nextDueDate : false

  return {
    isDue,
    hasHistory: true,
    lastDate: history.lastDate,
    nextDueDate: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
    overdueBy,
    doses: givenDoses
  }
}

const conditionLabels = {
  diabetes: 'you have diabetes',
  smoker: 'you smoke',
  exSmoker: 'you used to smoke',
  pregnant: 'you are pregnant',
  clinicalRiskGroup: 'you have a health condition',
  carer: 'you are a carer',
  immunosuppressed: 'you have a weakened immune system',
  careHomeResident: 'you live in a care home'
}

function getMatchedConditions (person, prog) {
  if (!prog.otherEligibility) return []

  const { conditions } = prog.otherEligibility
  return conditions.filter(cond => person[cond] === true)
}

function checkOtherEligibility (person, prog) {
  if (!prog.otherEligibility) return false

  const { mode } = prog.otherEligibility
  const matched = getMatchedConditions(person, prog)

  if (mode === 'and') {
    return matched.length === prog.otherEligibility.conditions.length
  } else {
    return matched.length > 0
  }
}

function filterProgrammes (person, today = getToday()) {
  return programmes
    .filter(prog => {
      const sexOk = prog.sex === 'all' || prog.sex === person.sex
      if (!sexOk) return false

      const ageOk = checkAge(person, prog, today)
      const otherOk = checkOtherEligibility(person, prog)

      // If has otherEligibility, must meet those conditions (and optionally age)
      // If no otherEligibility, must meet age requirement
      if (prog.otherEligibility) {
        return otherOk
      }
      return ageOk
    })
    .map(prog => {
      const ageOk = checkAge(person, prog, today)
      const matchedConditions = getMatchedConditions(person, prog)
      const otherOk = matchedConditions.length > 0
      const eligibilityReasons = matchedConditions.map(cond => conditionLabels[cond] || cond)

      // Check due status based on history and schedule
      const dueInfo = checkIfDue(person, prog, today)

      // Simplified status logic:
      // - opted-out: user has explicitly opted out
      // - partial: has history but doses < required
      // - due: no history, or interval has passed
      // - complete: has history and not due yet
      // - unknown: not eligible by age or conditions
      let status
      if (dueInfo.isOptedOut) {
        status = 'opted-out'
      } else if (!ageOk && !otherOk) {
        status = 'unknown'
      } else if (dueInfo.isPartial) {
        status = 'partial'
      } else if (dueInfo.isDue) {
        status = 'due'
      } else {
        status = 'complete'
      }

      return {
        ...prog,
        status,
        eligibilityReasons,
        lastDate: dueInfo.lastDate,
        nextDueDate: dueInfo.nextDueDate,
        overdueBy: dueInfo.overdueBy,
        doses: dueInfo.doses,
        requiredDoses: dueInfo.requiredDoses
      }
    })
}

router.use((req, res, next) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (persona) {
    req.session.data['userFirstName'] = persona.id
    req.session.data['userLastName'] = persona.lastName
  }
  next()
})

router.get('/data-settings', (req, res) => {
  res.render('data-settings', { personas })
})

router.get('/pages/your-health/vaccines-and-health-checks', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  // Calculate age from dateOfBirth for display
  const personaWithAge = {
    ...persona,
    age: persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
  }

  res.render('pages/your-health/vaccines-and-health-checks', {
    persona: personaWithAge,
    personas,
    today: today.toISOString().split('T')[0],
    programmes: filterProgrammes(persona, today),
    proxies: (persona.proxies || []).map(proxy => ({
      ...proxy,
      age: proxy.dateOfBirth ? calculateAge(proxy.dateOfBirth, today) : proxy.age,
      programmes: filterProgrammes(proxy, today)
    }))
  })
})

module.exports = router;
