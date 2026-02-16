/**
 * Routes for vaccines and health checks
 *
 * This is now much simpler — the eligibility engine
 * does all the heavy lifting.
 */

const express = require('express')
const router = express.Router()

const programmes = require('./data/screening-and-vaccines')
const personas = require('./data/personas')
const locations = require('./data/locations')
const { calculateAge, getProgrammesForPerson, getToday, checkAge, checkSex, checkConditions, conditionQuestions, getUnknownConditionKeys } = require('./lib/eligibility')

// -------------------------------------------------------
// Set current persona
// -------------------------------------------------------

router.use((req, res, next) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (persona) {
    req.session.data['userFirstName'] = persona.id
    req.session.data['userLastName'] = persona.lastName
  }
  next()
})

// -------------------------------------------------------
// Data settings page
// -------------------------------------------------------

router.get('/data-settings', (req, res) => {
  const today = getToday()
  const personasWithAge = personas.map(p => ({
    ...p,
    age: p.dateOfBirth ? calculateAge(p.dateOfBirth, today) : p.age,
    proxies: (p.proxies || []).map(proxy => ({
      ...proxy,
      age: proxy.dateOfBirth ? calculateAge(proxy.dateOfBirth, today) : proxy.age
    }))
  }))
  res.render('data-settings', { personas: personasWithAge, locations })
})

// -------------------------------------------------------
// Home page
// -------------------------------------------------------

router.get('/pages/home-p9', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  const grouped = getGroupedProgrammes(persona, today)
  const actionNeededCount = grouped.actionNeeded.length

  res.render('pages/home-p9', {
    actionNeededCount
  })
})

// -------------------------------------------------------
// Vaccines and health checks page
// -------------------------------------------------------

// Helper to get grouped programmes for a person
function getGroupedProgrammes (persona, today) {
  const userProgrammes = getProgrammesForPerson(persona, programmes, today)
  return {
    actionNeeded:     userProgrammes.filter(p => p.displayStatus === 'action-needed')
                        .sort((a, b) => (b.overdueDays || 0) - (a.overdueDays || 0)),
    overdue:          userProgrammes.filter(p => p.displayStatus === 'overdue')
                        .sort((a, b) => (b.overdueDays || 0) - (a.overdueDays || 0)),
    booked:           userProgrammes.filter(p => p.displayStatus === 'booked')
                        .sort((a, b) => (a.lastDate || '').localeCompare(b.lastDate || '')),
    upcoming:         userProgrammes.filter(p => p.displayStatus === 'upcoming'),
    unknown: userProgrammes.filter(p => p.displayStatus === 'unknown'),
    upToDate:         userProgrammes.filter(p => p.displayStatus === 'up-to-date'),
    optedOut:         userProgrammes.filter(p => p.displayStatus === 'opted-out'),
    expired:          userProgrammes.filter(p => p.displayStatus === 'expired')
  }
}

// Debug: add reason text to each included programme
function addReasonText (grouped, persona, today) {
  const age = persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
  const allProgs = [
    ...grouped.actionNeeded,
    ...grouped.overdue,
    ...grouped.booked,
    ...grouped.upcoming,
    ...grouped.unknown,
    ...grouped.upToDate,
    ...grouped.optedOut,
    ...grouped.expired
  ]
  for (const prog of allProgs) {
    const rawProg = programmes.find(p => p.id === prog.id)
    const reasons = []
    if (checkAge(persona, rawProg.eligibility, today)) {
      const { min, max } = rawProg.eligibility.age
      reasons.push('age ' + age + ' is within ' + min + '–' + (max === null ? 'no limit' : max))
    }
    if (prog.eligibilityReasons.length) {
      reasons.push(prog.eligibilityReasons.join(', '))
    }
    if (prog.unknownConditions.length) {
      reasons.push('unknown: ' + prog.unknownConditions.join(', '))
    }
    prog.reasonText = reasons.join(' + ') || 'no specific reason'
  }
}

// Debug: get programmes the person is NOT eligible for
function getExcludedProgrammes (persona, grouped, today) {
  const age = persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
  const includedIds = new Set([
    ...grouped.actionNeeded,
    ...grouped.overdue,
    ...grouped.booked,
    ...grouped.upcoming,
    ...grouped.unknown,
    ...grouped.upToDate,
    ...grouped.optedOut,
    ...grouped.expired
  ].map(p => p.id))

  return programmes
    .filter(p => !includedIds.has(p.id))
    .map(prog => {
      const reasons = []
      if (!checkSex(persona, prog.eligibility)) {
        reasons.push('sex is ' + persona.sex + ' (needs ' + prog.eligibility.sex + ')')
      }
      const { min, max } = prog.eligibility.age
      if (age < min) {
        reasons.push('age ' + age + ' below min ' + min)
      } else if (max !== null && age > max) {
        reasons.push('age ' + age + ' above max ' + max)
      }
      const condResult = checkConditions(persona, prog.eligibility)
      if (condResult === 'ineligible' && prog.eligibility.conditions) {
        reasons.push('conditions not met')
      }
      return {
        name: prog.name,
        reason: reasons.join(', ')
      }
    })
}

router.get('/pages/your-health/vaccines-and-health-checks', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  // Check if viewing a proxy
  const proxyId = req.query.proxy
  const allProxies = persona.proxies || []
  const activeProxy = proxyId ? allProxies.find(p => p.id === proxyId) : null
  const activePerson = activeProxy || persona

  const grouped = getGroupedProgrammes(activePerson, today)
  addReasonText(grouped, activePerson, today)
  const excluded = getExcludedProgrammes(activePerson, grouped, today)

  // Debug: log eligibility breakdown to console
  console.log(`\n--- ${activePerson.id} (age ${activePerson.dateOfBirth ? calculateAge(activePerson.dateOfBirth, today) : activePerson.age}, ${activePerson.sex}) ---`)
  for (const [status, progs] of Object.entries(grouped)) {
    if (progs.length) {
      console.log(`  ${status}:`)
      for (const p of progs) {
        console.log(`    ${p.name}: ${p.statusText} — ${p.reasonText || ''}`)
      }
    }
  }
  if (excluded.length) {
    console.log(`  not eligible (${excluded.length}):`)
    for (const p of excluded) {
      console.log(`    ${p.name} — ${p.reason}`)
    }
  }

  // Non-seasonal expired programmes (missed)
  const seasonalIds = new Set(programmes.filter(p => p.seasonalWindow).map(p => p.id))
  const missed = grouped.expired.filter(p => !seasonalIds.has(p.id))

  // Build proxy list with ages for the template
  const proxies = allProxies
    .map(proxy => ({
      ...proxy,
      age: proxy.dateOfBirth ? calculateAge(proxy.dateOfBirth, today) : proxy.age
    }))
    .sort((a, b) => (b.age || 0) - (a.age || 0))

  res.render('pages/your-health/vaccines-and-health-checks', {
    persona: {
      ...persona,
      age: persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
    },
    personas,
    today: today.toISOString().split('T')[0],
    grouped,
    excluded,
    missed,
    proxies,
    activeProxy: activeProxy ? {
      ...activeProxy,
      age: activeProxy.dateOfBirth ? calculateAge(activeProxy.dateOfBirth, today) : activeProxy.age
    } : null
  })
})

router.get('/pages/your-health/vaccines-and-health-checks-history', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  const grouped = getGroupedProgrammes(persona, today)

  res.render('pages/your-health/vaccines-and-health-checks-history', {
    persona: {
      ...persona,
      age: persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
    },
    grouped
  })
})

router.get('/pages/your-health/vaccines-and-health-checks-missed', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  const grouped = getGroupedProgrammes(persona, today)
  const seasonalIds = new Set(programmes.filter(p => p.seasonalWindow).map(p => p.id))
  const missed = grouped.expired.filter(p => !seasonalIds.has(p.id))

  res.render('pages/your-health/vaccines-and-health-checks-missed', {
    persona: {
      ...persona,
      age: persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
    },
    missed
  })
})

router.get('/pages/your-health/vaccines-and-health-checks-opted-out', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  const grouped = getGroupedProgrammes(persona, today)

  res.render('pages/your-health/vaccines-and-health-checks-opted-out', {
    persona: {
      ...persona,
      age: persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
    },
    grouped
  })
})

// -------------------------------------------------------
// Programme info screen
// -------------------------------------------------------

router.get('/pages/your-health/programme/:programmeId', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) {
    res.status(404).send('Programme not found')
    return
  }

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  const userProgrammes = getProgrammesForPerson(persona, programmes, today)
  const userProg = userProgrammes.find(p => p.id === programme.id)

  res.render('pages/your-health/programme', {
    programme,
    displayStatus: userProg ? userProg.displayStatus : 'unknown',
    statusText: userProg ? userProg.statusText : null
  })
})

router.get('/pages/your-health/programme/:programmeId/opt-out', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  res.render('pages/your-health/opt-out', { programme })
})

router.post('/pages/your-health/programme/:programmeId/opt-out', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (persona) {
    if (!persona.history) persona.history = {}
    persona.history[programme.id] = { optedOut: true }
  }

  res.render('pages/your-health/opt-out-confirmed', { programme })
})

router.get('/pages/your-health/programme/:programmeId/had-elsewhere', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  res.render('pages/your-health/had-elsewhere', { programme })
})

router.post('/pages/your-health/programme/:programmeId/had-elsewhere', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  res.render('pages/your-health/had-elsewhere-when', { programme })
})

router.post('/pages/your-health/programme/:programmeId/had-elsewhere-when', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (persona) {
    if (!persona.history) persona.history = {}
    // Approximate a date based on the answer
    const today = getToday()
    const when = req.session.data['had-elsewhere-when']
    let lastDate
    if (when === 'last-month') {
      lastDate = new Date(today)
      lastDate.setDate(lastDate.getDate() - 14)
    } else if (when === 'last-6-months') {
      lastDate = new Date(today)
      lastDate.setMonth(lastDate.getMonth() - 3)
    } else {
      lastDate = new Date(today)
      lastDate.setMonth(lastDate.getMonth() - 9)
    }
    persona.history[programme.id] = { lastDate: lastDate.toISOString().split('T')[0] }
  }

  res.render('pages/your-health/had-elsewhere-confirmed', { programme })
})

router.post('/pages/your-health/programme/:programmeId/cancel', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) {
    res.status(404).send('Programme not found')
    return
  }

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (persona) {
    if (!persona.history) persona.history = {}
    delete persona.history[programme.id]
  }

  res.redirect('/pages/your-health/vaccines-and-health-checks')
})

router.post('/pages/your-health/programme/:programmeId/opt-back-in', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) {
    res.status(404).send('Programme not found')
    return
  }

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (persona && persona.history) {
    delete persona.history[programme.id]
  }

  res.redirect('/pages/your-health/vaccines-and-health-checks')
})

// -------------------------------------------------------
// Eligibility question flow
// -------------------------------------------------------

// Count how many programmes each condition appears in (for question ordering)
const conditionFrequency = {}
for (const prog of programmes) {
  if (!prog.eligibility.conditions) continue
  for (const cond of prog.eligibility.conditions.required) {
    conditionFrequency[cond] = (conditionFrequency[cond] || 0) + 1
  }
}

// Start: determine questions and redirect to first question
router.get('/pages/your-health/eligibility/:programmeId/start', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)

  let questionKeys = getUnknownConditionKeys(persona, programme.eligibility)

  // Don't ask men if they are pregnant
  if (persona.sex === 'male') {
    questionKeys = questionKeys.filter(k => k !== 'pregnant')
  }

  // Order by most programmes affected first
  questionKeys.sort((a, b) => (conditionFrequency[b] || 0) - (conditionFrequency[a] || 0))

  req.session.data['eligibility-questions'] = questionKeys
  req.session.data['eligibility-answers'] = {}

  res.redirect('/pages/your-health/eligibility/' + programme.id + '/question/0')
})

// Show a question
router.get('/pages/your-health/eligibility/:programmeId/question/:index', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  const questionKeys = req.session.data['eligibility-questions'] || []
  const index = parseInt(req.params.index, 10)
  const conditionKey = questionKeys[index]

  if (!conditionKey) { res.redirect('/pages/your-health/eligibility/' + programme.id + '/result'); return }

  const previousAnswer = (req.session.data['eligibility-answers'] || {})[conditionKey] || null
  const backUrl = index === 0
    ? '/pages/your-health/programme/' + programme.id
    : '/pages/your-health/eligibility/' + programme.id + '/question/' + (index - 1)

  res.render('pages/your-health/eligibility/question', {
    programme,
    programmeId: programme.id,
    questionIndex: index,
    conditionKey,
    questionText: conditionQuestions[conditionKey] || conditionKey,
    previousAnswer,
    backUrl
  })
})

// Process answer and go to next question or result
router.post('/pages/your-health/eligibility/:programmeId/question/:index', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  const questionKeys = req.session.data['eligibility-questions'] || []
  const index = parseInt(req.params.index, 10)
  const conditionKey = questionKeys[index]

  if (!req.session.data['eligibility-answers']) req.session.data['eligibility-answers'] = {}
  req.session.data['eligibility-answers'][conditionKey] = req.body[conditionKey]

  // For 'or' mode: stop as soon as the user answers yes
  const mode = programme.eligibility.conditions ? programme.eligibility.conditions.mode : 'or'
  if (mode === 'or' && req.body[conditionKey] === 'yes') {
    res.redirect('/pages/your-health/eligibility/' + programme.id + '/result')
    return
  }

  if (index + 1 < questionKeys.length) {
    res.redirect('/pages/your-health/eligibility/' + programme.id + '/question/' + (index + 1))
  } else {
    res.redirect('/pages/your-health/eligibility/' + programme.id + '/result')
  }
})

// Show result
router.get('/pages/your-health/eligibility/:programmeId/result', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  const answers = req.session.data['eligibility-answers'] || {}
  const questionKeys = req.session.data['eligibility-questions'] || []

  // Evaluate: check if answers satisfy the programme's conditions
  const conditions = programme.eligibility.conditions
  const mode = conditions ? conditions.mode : 'or'
  const boolAnswers = questionKeys.map(key => answers[key] === 'yes')

  // Update persona conditions from answers
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (!persona.conditions) persona.conditions = {}
  for (const [key, value] of Object.entries(answers)) {
    persona.conditions[key] = (value === 'yes')
  }

  let eligible
  if (mode === 'and') {
    eligible = boolAnswers.every(v => v === true)
  } else {
    eligible = boolAnswers.some(v => v === true)
  }

  const template = eligible
    ? 'pages/your-health/eligibility/result-eligible'
    : 'pages/your-health/eligibility/result-ineligible'

  res.render(template, {
    programme,
    lastQuestionIndex: questionKeys.length - 1
  })
})

// Commit eligible result and redirect to booking
router.post('/pages/your-health/eligibility/:programmeId/result', (req, res) => {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) { res.status(404).send('Programme not found'); return }

  res.redirect('/pages/your-health/book/' + programme.id + '/find-location')
})

// -------------------------------------------------------
// Booking flow
// -------------------------------------------------------

// Dummy appointment slots
const dummyAppointments = [
  {
    date: 'Monday 17 February 2026',
    slots: [
      { time: '9:00am' },
      { time: '9:30am' },
      { time: '11:00am' }
    ]
  },
  {
    date: 'Tuesday 18 February 2026',
    slots: [
      { time: '8:30am' },
      { time: '10:00am' },
      { time: '2:30pm' }
    ]
  },
  {
    date: 'Wednesday 19 February 2026',
    slots: [
      { time: '9:00am' },
      { time: '11:30am' },
      { time: '3:00pm' }
    ]
  }
]

// Helper: look up programme by ID or 404
function findProgramme (req, res) {
  const programme = programmes.find(p => p.id === req.params.programmeId)
  if (!programme) {
    res.status(404).send('Programme not found')
    return null
  }
  return programme
}

// Step 1: Find a location
router.get('/pages/your-health/book/:programmeId/find-location', (req, res) => {
  const programme = findProgramme(req, res)
  if (!programme) return

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)

  const nominatedGpSurgery = locations.find(loc => loc.id === persona.nominatedGpSurgery)
  const nominatedPharmacy = locations.find(loc => loc.id === persona.nominatedPharmacy)

  const filteredLocations = locations
    .filter(loc => (programme.settings || []).includes(loc.type))
    .map(loc => ({
      ...loc,
      isNominatedPharmacy: loc.id === persona.nominatedPharmacy,
      offersWalkIn: programme.walkIn && (loc.walkInVaccines || []).includes(programme.id)
    }))

  res.render('pages/your-health/book/find-location', {
    programme,
    locations: filteredLocations,
    nominatedGpSurgery,
    nominatedPharmacy
  })
})

// Step 2a: Walk-in (pharmacy)
router.post('/pages/your-health/book/:programmeId/walk-in', (req, res) => {
  const programme = findProgramme(req, res)
  if (!programme) return

  const locationId = req.session.data['book-location-id']
  const location = locations.find(l => l.id === locationId)

  res.render('pages/your-health/book/walk-in', {
    programme,
    location
  })
})

// Step 2b: Choose an appointment
router.post('/pages/your-health/book/:programmeId/choose-appointment', (req, res) => {
  const programme = findProgramme(req, res)
  if (!programme) return

  res.render('pages/your-health/book/choose-appointment', {
    programme,
    appointments: dummyAppointments
  })
})

// Step 3: Confirm
router.post('/pages/your-health/book/:programmeId/confirm', (req, res) => {
  const programme = findProgramme(req, res)
  if (!programme) return

  res.render('pages/your-health/book/confirm', {
    programme
  })
})

// Step 4: Confirmed — update persona history so the programme moves to up-to-date
router.post('/pages/your-health/book/:programmeId/confirmed', (req, res) => {
  const programme = findProgramme(req, res)
  if (!programme) return

  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  if (persona) {
    if (!persona.history) persona.history = {}
    // Parse the display date (e.g. "Monday 17 February 2026") to ISO
    const bookDateStr = req.session.data['book-date'] || ''
    const parsedDate = new Date(bookDateStr.replace(/^\w+\s/, ''))
    const isoDate = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : getToday().toISOString().split('T')[0]
    persona.history[programme.id] = { lastDate: isoDate }
  }

  res.render('pages/your-health/book/confirmed', {
    programme
  })
})

module.exports = router
