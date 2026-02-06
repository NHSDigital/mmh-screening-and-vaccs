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
const { calculateAge, getProgrammesForPerson, getToday } = require('./lib/eligibility')

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
    actionNeeded:     userProgrammes.filter(p => p.displayStatus === 'action-needed'),
    inProgress:       userProgrammes.filter(p => p.displayStatus === 'in-progress'),
    upcoming:         userProgrammes.filter(p => p.displayStatus === 'upcoming'),
    checkEligibility: userProgrammes.filter(p => p.displayStatus === 'check-eligibility'),
    upToDate:         userProgrammes.filter(p => p.displayStatus === 'up-to-date'),
    optedOut:         userProgrammes.filter(p => p.displayStatus === 'opted-out')
  }
}

router.get('/pages/your-health/vaccines-and-health-checks', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)
  const today = getToday()

  const grouped = getGroupedProgrammes(persona, today)

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

module.exports = router
