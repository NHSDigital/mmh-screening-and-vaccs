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
const { calculateAge, getProgrammesForPerson, getToday, checkAge, checkSex, checkConditions } = require('./lib/eligibility')

// -------------------------------------------------------
// Middleware: set current persona
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
  res.render('data-settings', { personas })
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
    inProgress:       userProgrammes.filter(p => p.displayStatus === 'in-progress'),
    booked:           userProgrammes.filter(p => p.displayStatus === 'booked'),
    upcoming:         userProgrammes.filter(p => p.displayStatus === 'upcoming'),
    unknown: userProgrammes.filter(p => p.displayStatus === 'unknown'),
    upToDate:         userProgrammes.filter(p => p.displayStatus === 'up-to-date'),
    optedOut:         userProgrammes.filter(p => p.displayStatus === 'opted-out')
  }
}

// Debug: add reason text to each included programme
function addReasonText (grouped, persona, today) {
  const age = persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
  const allProgs = [
    ...grouped.actionNeeded,
    ...grouped.inProgress,
    ...grouped.booked,
    ...grouped.upcoming,
    ...grouped.unknown,
    ...grouped.upToDate,
    ...grouped.optedOut
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
    ...grouped.inProgress,
    ...grouped.booked,
    ...grouped.upcoming,
    ...grouped.unknown,
    ...grouped.upToDate,
    ...grouped.optedOut
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

  const grouped = getGroupedProgrammes(persona, today)
  addReasonText(grouped, persona, today)
  const excluded = getExcludedProgrammes(persona, grouped, today)

  // Build proxies (children managed by this person)
  const proxies = (persona.proxies || []).map(proxy => ({
    ...proxy,
    age: proxy.dateOfBirth ? calculateAge(proxy.dateOfBirth, today) : proxy.age,
    grouped: getGroupedProgrammes(proxy, today)
  }))

  res.render('pages/your-health/vaccines-and-health-checks', {
    persona: {
      ...persona,
      age: persona.dateOfBirth ? calculateAge(persona.dateOfBirth, today) : persona.age
    },
    personas,
    today: today.toISOString().split('T')[0],
    grouped,
    excluded,
    proxies
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

  const filteredLocations = locations.filter(loc =>
    (programme.settings || []).includes(loc.type)
  )

  res.render('pages/your-health/book/find-location', {
    programme,
    locations: filteredLocations
  })
})

// Step 2: Choose an appointment
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
    const entry = { lastDate: isoDate }
    if (programme.schedule.type === 'multi-dose' && programme.schedule.doses) {
      entry.doses = programme.schedule.doses
    }
    persona.history[programme.id] = entry
  }

  res.render('pages/your-health/book/confirmed', {
    programme
  })
})

module.exports = router
