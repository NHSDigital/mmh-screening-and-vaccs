// External dependencies
const express = require('express');

const router = express.Router();

const programmes = require('./data/screening-and-vaccines')
const personas = require('./data/personas')

function filterProgrammes (person) {
  return programmes
    .filter(prog => {
      const ageOk = person.age >= prog.minAge && person.age <= prog.maxAge
      const sexOk = prog.sex === 'all' || prog.sex === person.sex
      return (ageOk && sexOk) || (prog.otherEligibility && sexOk)
    })
    .map(prog => {
      const ageOk = person.age >= prog.minAge && person.age <= prog.maxAge
      const defaultStatus = ageOk ? 'due' : 'unknown'
      return {
        ...prog,
        status: (person.statuses && person.statuses[prog.id]) || defaultStatus
      }
    })
}

router.get('/screening', (req, res) => {
  const personaId = req.session.data['persona'] || personas[0].id
  const persona = personas.find(p => p.id === personaId)

  res.render('screening', {
    persona,
    personas,
    programmes: filterProgrammes(persona),
    proxies: (persona.proxies || []).map(proxy => ({
      ...proxy,
      programmes: filterProgrammes(proxy)
    }))
  })
})

module.exports = router;
