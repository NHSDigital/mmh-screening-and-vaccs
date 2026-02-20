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

  // Build full history from persona's history object
  const history = persona.history || {}
  const historyItems = []
  for (const [progId, entry] of Object.entries(history)) {
    if (entry.optedOut) continue
    if (!entry.lastDate) continue
    const prog = programmes.find(p => p.id === progId)
    if (!prog) continue
    if (new Date(entry.lastDate) > today) continue
    historyItems.push({
      id: prog.id,
      name: prog.name,
      type: prog.type,
      lastDate: entry.lastDate
    })
  }

  // Sort by date, most recent first
  historyItems.sort((a, b) => b.lastDate.localeCompare(a.lastDate))

  const vaccines = historyItems.filter(h => h.type === 'vaccine')
  const screenings = historyItems.filter(h => h.type === 'screening')

  res.render('pages/your-health/vaccines-and-health-checks-history', {
    persona: {
      ...persona,
      age: persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
    },
    vaccines,
    screenings
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
    statusText: userProg ? userProg.statusText : null,
    eligibilityReasons: userProg ? userProg.eligibilityReasons : []
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

// -------------------------------------------------------
// Create persona flow
// -------------------------------------------------------

// Condition labels for display on check-answers page
const conditionLabelsForPersona = {
  diabetes: 'Diabetes',
  smoker: 'Current smoker',
  exSmoker: 'Ex-smoker',
  pregnant: 'Pregnant',
  clinicalRiskGroup: 'Long-term health condition',
  carer: 'Unpaid carer',
  immunosuppressed: 'Weakened immune system',
  careHomeResident: 'Care home resident'
}

// All condition keys
const allConditionKeys = ['diabetes', 'smoker', 'exSmoker', 'pregnant', 'clinicalRiskGroup', 'carer', 'immunosuppressed', 'careHomeResident']

/**
 * Build a temporary persona from session data for eligibility checks.
 */
function buildTempPersona (data) {
  const day = data['create-persona-dob-day'] || '1'
  const month = data['create-persona-dob-month'] || '1'
  const year = data['create-persona-dob-year'] || '1970'
  const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const sex = data['create-persona-sex'] || 'female'

  const selectedConditions = data['create-persona-conditions'] || []
  const conditions = {}
  for (const key of allConditionKeys) {
    conditions[key] = Array.isArray(selectedConditions) ? selectedConditions.includes(key) : selectedConditions === key
  }

  return {
    id: data['create-persona-first-name'] || 'Custom',
    lastName: data['create-persona-last-name'] || 'Persona',
    dateOfBirth: dob,
    sex,
    conditions,
    history: {}
  }
}

/**
 * Get programmes a persona could have had (for history selection).
 * Returns first-dose-only programmes matching age, sex and conditions.
 */
function getCouldHaveHadProgrammes (tempPersona, type) {
  const today = getToday()
  const age = calculateAge(tempPersona.dateOfBirth, today)

  return programmes.filter(prog => {
    // Filter by type
    if (prog.type !== type) return false

    // Skip later doses in multi-dose chains — only show first dose
    if (prog.eligibility.requires && prog.eligibility.requires.length) return false

    // Skip programmes requiring opt-out of another
    if (prog.eligibility.requiresOptOut) return false

    // Sex must match
    if (!checkSex(tempPersona, prog.eligibility)) return false

    // Person must be old enough (current age >= min age)
    if (age < prog.eligibility.age.min) return false

    // For condition-required programmes, check conditions
    if (prog.eligibility.conditions) {
      const { mode, required } = prog.eligibility.conditions
      const personConditions = tempPersona.conditions || {}

      if (mode === 'and') {
        // All required conditions must be true
        const allMet = required.every(c => personConditions[c] === true)
        if (!allMet) return false
      }
      // For 'or' mode: age qualifies OR at least one condition — age already qualifies if we passed min check
    }

    // Skip pregnancy vaccines if not pregnant
    if (prog.eligibility.conditions && prog.eligibility.conditions.mode === 'and' &&
        prog.eligibility.conditions.required.includes('pregnant') &&
        !tempPersona.conditions.pregnant) {
      return false
    }

    return true
  })
}

/**
 * Generate a sensible history date for a programme the persona has had.
 */
function generateHistoryDate (prog, tempPersona) {
  const today = getToday()
  const dob = new Date(tempPersona.dateOfBirth)
  const age = calculateAge(tempPersona.dateOfBirth, today)

  if (prog.seasonalWindow) {
    // Seasonal: last October 1st
    const year = today.getMonth() >= 9 ? today.getFullYear() : today.getFullYear() - 1
    return `${year}-10-01`
  }

  if (prog.schedule.type === 'recurring' && prog.schedule.intervalYears) {
    // Recurring: halfway through the interval (shows as upcoming, not overdue)
    const halfInterval = Math.floor(prog.schedule.intervalYears * 365 / 2)
    const date = new Date(today)
    date.setDate(date.getDate() - halfInterval)
    return date.toISOString().split('T')[0]
  }

  // One-off: 3 months after becoming eligible
  const eligibleDate = new Date(dob)
  eligibleDate.setFullYear(eligibleDate.getFullYear() + prog.eligibility.age.min)
  eligibleDate.setMonth(eligibleDate.getMonth() + 3)
  // Don't use a future date
  if (eligibleDate > today) {
    const date = new Date(today)
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  }
  return eligibleDate.toISOString().split('T')[0]
}

/**
 * Find all doses in a multi-dose chain starting from a first dose.
 */
function getMultiDoseChain (firstDoseId) {
  const chain = [firstDoseId]
  let currentId = firstDoseId
  // Find programmes that require currentId
  while (true) {
    const nextDose = programmes.find(p =>
      p.eligibility.requires && p.eligibility.requires.includes(currentId)
    )
    if (!nextDose) break
    chain.push(nextDose.id)
    currentId = nextDose.id
  }
  return chain
}

// Page 1: Name
router.get('/pages/create-persona/name', (req, res) => {
  res.render('pages/create-persona/name')
})

router.post('/pages/create-persona/name', (req, res) => {
  res.redirect('/pages/create-persona/date-of-birth')
})

// Page 2: Date of birth
router.get('/pages/create-persona/date-of-birth', (req, res) => {
  res.render('pages/create-persona/date-of-birth')
})

router.post('/pages/create-persona/date-of-birth', (req, res) => {
  res.redirect('/pages/create-persona/sex')
})

// Page 3: Sex
router.get('/pages/create-persona/sex', (req, res) => {
  res.render('pages/create-persona/sex')
})

router.post('/pages/create-persona/sex', (req, res) => {
  res.redirect('/pages/create-persona/conditions')
})

// Page 4: Conditions
router.get('/pages/create-persona/conditions', (req, res) => {
  const sex = req.session.data['create-persona-sex'] || 'female'
  res.render('pages/create-persona/conditions', { sex })
})

router.post('/pages/create-persona/conditions', (req, res) => {
  res.redirect('/pages/create-persona/vaccine-history')
})

// Page 5: Vaccine history
router.get('/pages/create-persona/vaccine-history', (req, res) => {
  const tempPersona = buildTempPersona(req.session.data)
  const vaccines = getCouldHaveHadProgrammes(tempPersona, 'vaccine')
  res.render('pages/create-persona/vaccine-history', { vaccines })
})

router.post('/pages/create-persona/vaccine-history', (req, res) => {
  res.redirect('/pages/create-persona/screening-history')
})

// Page 6: Screening history
router.get('/pages/create-persona/screening-history', (req, res) => {
  const tempPersona = buildTempPersona(req.session.data)
  const screenings = getCouldHaveHadProgrammes(tempPersona, 'screening')
  res.render('pages/create-persona/screening-history', { screenings })
})

router.post('/pages/create-persona/screening-history', (req, res) => {
  res.redirect('/pages/create-persona/check-answers')
})

// Page 7: Check your answers
router.get('/pages/create-persona/check-answers', (req, res) => {
  const data = req.session.data

  const firstName = data['create-persona-first-name'] || 'Custom'
  const lastName = data['create-persona-last-name'] || 'Persona'
  const day = data['create-persona-dob-day'] || '1'
  const month = data['create-persona-dob-month'] || '1'
  const year = data['create-persona-dob-year'] || '1970'
  const sex = data['create-persona-sex'] || 'female'

  // Conditions summary
  const selectedConditions = data['create-persona-conditions'] || []
  const conditionsArray = Array.isArray(selectedConditions) ? selectedConditions : [selectedConditions]
  const conditionsHtml = conditionsArray.length
    ? conditionsArray.map(c => conditionLabelsForPersona[c] || c).join('<br>')
    : 'None'

  // Vaccine history summary
  const selectedVaccines = data['create-persona-vaccines'] || []
  const vaccinesArray = Array.isArray(selectedVaccines) ? selectedVaccines : (selectedVaccines ? [selectedVaccines] : [])
  const vaccinesHtml = vaccinesArray.length
    ? vaccinesArray.map(id => {
        const prog = programmes.find(p => p.id === id)
        return prog ? (prog.baseName || prog.name) : id
      }).join('<br>')
    : 'None'

  // Screening history summary
  const selectedScreening = data['create-persona-screening'] || []
  const screeningArray = Array.isArray(selectedScreening) ? selectedScreening : (selectedScreening ? [selectedScreening] : [])
  const screeningsHtml = screeningArray.length
    ? screeningArray.map(id => {
        const prog = programmes.find(p => p.id === id)
        return prog ? prog.name : id
      }).join('<br>')
    : 'None'

  res.render('pages/create-persona/check-answers', {
    summary: {
      name: firstName + ' ' + lastName,
      dateOfBirth: day + '/' + month + '/' + year,
      sex: sex.charAt(0).toUpperCase() + sex.slice(1),
      conditionsHtml,
      vaccinesHtml,
      screeningsHtml
    }
  })
})

router.post('/pages/create-persona/check-answers', (req, res) => {
  const data = req.session.data

  const firstName = data['create-persona-first-name'] || 'Custom'
  const lastName = data['create-persona-last-name'] || 'Persona'
  const day = data['create-persona-dob-day'] || '1'
  const month = data['create-persona-dob-month'] || '1'
  const year = data['create-persona-dob-year'] || '1970'
  const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  let sex = data['create-persona-sex']
  if (!sex) sex = Math.random() < 0.5 ? 'male' : 'female'

  // Conditions: checked items are true, unchecked are false
  const selectedConditions = data['create-persona-conditions'] || []
  const conditionsArray = Array.isArray(selectedConditions) ? selectedConditions : [selectedConditions]
  const conditions = {}
  for (const key of allConditionKeys) {
    conditions[key] = conditionsArray.includes(key)
  }

  // History: generate dates for checked programmes
  const history = {}
  const checkedVaccines = data['create-persona-vaccines'] || []
  const vaccinesArray = Array.isArray(checkedVaccines) ? checkedVaccines : (checkedVaccines ? [checkedVaccines] : [])
  const checkedScreening = data['create-persona-screening'] || []
  const screeningArray = Array.isArray(checkedScreening) ? checkedScreening : (checkedScreening ? [checkedScreening] : [])

  const tempPersona = buildTempPersona(data)

  // Process vaccines — expand multi-dose chains
  for (const vaccineId of vaccinesArray) {
    const chain = getMultiDoseChain(vaccineId)
    const prog = programmes.find(p => p.id === vaccineId)
    if (!prog) continue
    const baseDate = generateHistoryDate(prog, tempPersona)

    for (let i = 0; i < chain.length; i++) {
      const doseDate = new Date(baseDate)
      doseDate.setMonth(doseDate.getMonth() + (i * 2))
      const today = getToday()
      if (doseDate > today) {
        doseDate.setTime(today.getTime())
        doseDate.setDate(doseDate.getDate() - 7)
      }
      history[chain[i]] = { lastDate: doseDate.toISOString().split('T')[0] }
    }
  }

  // Process screenings
  for (const screeningId of screeningArray) {
    const prog = programmes.find(p => p.id === screeningId)
    if (!prog) continue
    history[screeningId] = { lastDate: generateHistoryDate(prog, tempPersona) }
  }

  // Assign first GP surgery and first pharmacy from locations
  const persona = {
    id: firstName,
    lastName,
    dateOfBirth: dob,
    sex,
    nominatedGpSurgery: locations.find(l => l.type === 'gp-surgery').id,
    nominatedPharmacy: locations.find(l => l.type === 'pharmacy').id,
    conditions,
    history
  }

  personas.push(persona)
  req.session.data['persona'] = persona.id
  res.redirect('/frame')
})

module.exports = router
