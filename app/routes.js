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
  if (!history || !history.lastDate) {
    return { isDue: true, lastDate: null, nextDueDate: null }
  }

  const lastDate = new Date(history.lastDate)

  // One-time programmes - if done, not due again
  if (prog.schedule.type === 'one-time') {
    return { isDue: false, lastDate: history.lastDate, nextDueDate: null, status: history.status }
  }

  // Calculate next due date based on schedule type
  let nextDueDate = null

  if (prog.schedule.type === 'interval' && prog.schedule.intervalYears) {
    nextDueDate = new Date(lastDate)
    nextDueDate.setFullYear(nextDueDate.getFullYear() + prog.schedule.intervalYears)
  } else if (prog.schedule.type === 'annual') {
    nextDueDate = new Date(lastDate)
    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
  } else if (prog.schedule.type === 'seasonal') {
    // Seasonal vaccines are due each season (e.g., autumn)
    nextDueDate = new Date(lastDate)
    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
  }

  const isDue = nextDueDate ? today >= nextDueDate : false

  return {
    isDue,
    lastDate: history.lastDate,
    nextDueDate: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
    status: history.status,
    doses: history.doses
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

      let status
      if (dueInfo.status === 'partial') {
        status = 'partial'
      } else if (dueInfo.status === 'opted-out') {
        status = 'opted-out'
      } else if (!ageOk && !otherOk) {
        status = 'unknown'
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
        doses: dueInfo.doses
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
