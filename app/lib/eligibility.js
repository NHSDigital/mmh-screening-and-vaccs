/**
 * Eligibility engine
 *
 * Works out which programmes apply to a person
 * and what status each one has.
 *
 * Handles three condition states:
 *   true      → confirmed eligible
 *   false     → confirmed not eligible
 *   undefined → we don't know — show "check if eligible"
 */

// -------------------------------------------------------
// Date helpers
// -------------------------------------------------------

function getToday () {
  return new Date()
}

function calculateAge (dateOfBirth, today = getToday()) {
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// -------------------------------------------------------
// Eligibility checks
// -------------------------------------------------------

function checkAge (person, eligibility, today = getToday()) {
  const age = person.dateOfBirth
    ? calculateAge(person.dateOfBirth, today)
    : person.age
  const { min, max } = eligibility.age
  return age >= min && (max === null || age <= max)
}

function checkSex (person, eligibility) {
  return eligibility.sex === 'all' || eligibility.sex === person.sex
}

/**
 * Check condition-based eligibility.
 *
 * Returns:
 *   "eligible"   — all/any required conditions are confirmed true
 *   "ineligible" — all/any required conditions are confirmed false
 *   "unknown"    — at least one condition is undefined (we don't have the data)
 */
function checkConditions (person, eligibility) {
  const { conditions } = eligibility
  if (!conditions) return 'eligible' // no conditions needed

  const { mode, required } = conditions
  const personConditions = person.conditions || {}

  const results = required.map(cond => {
    const value = personConditions[cond]
    if (value === true) return 'yes'
    if (value === false) return 'no'
    return 'unknown' // undefined — we don't have this data
  })

  if (mode === 'and') {
    // All conditions must be true
    if (results.every(r => r === 'yes')) return 'eligible'
    if (results.some(r => r === 'no')) return 'ineligible'
    return 'unknown'
  } else {
    // At least one condition must be true (mode === 'or')
    if (results.some(r => r === 'yes')) return 'eligible'
    if (results.every(r => r === 'no')) return 'ineligible'
    // Some are unknown, none are yes — we can't confirm eligibility
    return 'unknown'
  }
}

// -------------------------------------------------------
// Condition labels (for "eligible because..." text)
// -------------------------------------------------------

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

function getEligibilityReasons (person, eligibility) {
  if (!eligibility.conditions) return []
  const personConditions = person.conditions || {}
  return eligibility.conditions.required
    .filter(cond => personConditions[cond] === true)
    .map(cond => conditionLabels[cond] || cond)
}

function getUnknownConditions (person, eligibility) {
  if (!eligibility.conditions) return []
  const personConditions = person.conditions || {}
  return eligibility.conditions.required
    .filter(cond => personConditions[cond] === undefined)
    .map(cond => conditionLabels[cond] || cond)
}

// -------------------------------------------------------
// Schedule / history checks
// -------------------------------------------------------

function checkHistory (person, programme, today = getToday()) {
  const history = person.history && person.history[programme.id]
  const schedule = programme.schedule

  // No history at all — never had it
  if (!history) {
    return {
      status: 'never-had',
      lastDate: null,
      nextDueDate: null
    }
  }

  // Opted out
  if (history.optedOut) {
    return { status: 'opted-out' }
  }

  // Has entry but no date — treat as never had
  if (!history.lastDate) {
    return {
      status: 'never-had',
      lastDate: null,
      nextDueDate: null
    }
  }

  const lastDate = new Date(history.lastDate)

  // Multi-dose: check if all doses given
  if (schedule.type === 'multi-dose') {
    const requiredDoses = schedule.doses || 1
    const givenDoses = history.doses || 1

    if (givenDoses < requiredDoses) {
      return {
        status: 'partial',
        lastDate: history.lastDate,
        doses: givenDoses,
        requiredDoses
      }
    }

    // All doses given
    return {
      status: 'complete',
      lastDate: history.lastDate,
      doses: givenDoses,
      requiredDoses
    }
  }

  // One-off: if they've had it, they're done
  if (schedule.type === 'one-off') {
    return {
      status: 'complete',
      lastDate: history.lastDate
    }
  }

  // Recurring: check if due again
  if (schedule.type === 'recurring' && schedule.intervalYears) {
    const nextDueDate = new Date(lastDate)
    nextDueDate.setFullYear(nextDueDate.getFullYear() + schedule.intervalYears)

    if (today >= nextDueDate) {
      // Overdue
      const diffDays = Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24))
      return {
        status: 'overdue',
        lastDate: history.lastDate,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        overdueDays: diffDays
      }
    }

    // Not yet due — upcoming
    return {
      status: 'upcoming',
      lastDate: history.lastDate,
      nextDueDate: nextDueDate.toISOString().split('T')[0]
    }
  }

  // Fallback
  return {
    status: 'complete',
    lastDate: history.lastDate
  }
}

// -------------------------------------------------------
// Main: build the list for a person
// -------------------------------------------------------

/**
 * Returns a flat list of programmes relevant to this person,
 * each with a `displayStatus` that the template can use directly.
 *
 * Display statuses:
 *   "action-needed"     — book now (due, overdue, or never had)
 *   "in-progress"       — multi-dose vaccine, some doses given
 *   "upcoming"          — not due yet, but will be
 *   "unknown"           — we don't have enough data to confirm
 *   "up-to-date"        — complete and not due again yet
 *   "opted-out"         — user has opted out
 */
function getProgrammesForPerson (person, programmes, today = getToday()) {
  return programmes
    .filter(prog => {
      // Must match sex
      if (!checkSex(person, prog.eligibility)) return false

      // Upper age limit is always enforced — conditions can make
      // someone below the minimum age eligible, but never above the max
      const age = person.dateOfBirth
        ? calculateAge(person.dateOfBirth, today)
        : person.age
      const { max } = prog.eligibility.age
      if (max !== null && age > max) return false

      const ageOk = checkAge(person, prog.eligibility, today)
      const conditionResult = checkConditions(person, prog.eligibility)

      // No conditions defined — age is the only criterion
      if (!prog.eligibility.conditions) return ageOk

      // 'and' mode (e.g. diabetic eye, pregnancy vaccines):
      // age AND conditions must both be satisfied
      if (prog.eligibility.conditions.mode === 'and') {
        if (conditionResult === 'ineligible') return false
        return ageOk && (conditionResult === 'eligible' || conditionResult === 'unknown')
      }

      // 'or' mode (e.g. flu, shingles, COVID):
      // age alone OR conditions alone can qualify
      if (conditionResult === 'ineligible' && !ageOk) return false
      return ageOk || conditionResult === 'eligible' || conditionResult === 'unknown'
    })
    .map(prog => {
      const ageOk = checkAge(person, prog.eligibility, today)
      const conditionResult = checkConditions(person, prog.eligibility)
      const historyInfo = checkHistory(person, prog, today)
      const eligibilityReasons = getEligibilityReasons(person, prog.eligibility)
      const unknownConditions = getUnknownConditions(person, prog.eligibility)

      // Work out display status
      let displayStatus

      if (historyInfo.status === 'opted-out') {
        displayStatus = 'opted-out'

      } else if (conditionResult === 'unknown') {
        // Check if unknown conditions genuinely affect eligibility
        const condMode = prog.eligibility.conditions && prog.eligibility.conditions.mode
        if (condMode === 'and' || !ageOk) {
          // 'and' mode: conditions are required alongside age — we can't confirm
          // 'or' mode but not age-eligible: conditions are the only path — we can't confirm
          displayStatus = 'unknown'
        }
      }

      if (!displayStatus) {
        if (historyInfo.status === 'partial') {
          displayStatus = 'in-progress'
        } else if (historyInfo.status === 'never-had' || historyInfo.status === 'overdue') {
          displayStatus = 'action-needed'
        } else if (historyInfo.status === 'upcoming') {
          displayStatus = 'upcoming'
        } else {
          displayStatus = 'up-to-date'
        }
      }

      const statusText = buildDescription(prog, displayStatus, historyInfo)

      return {
        id: prog.id,
        name: prog.name,
        type: prog.type,
        description: prog.description,
        displayStatus,
        statusText,
        lastDate: historyInfo.lastDate,
        nextDueDate: historyInfo.nextDueDate,
        overdueDays: historyInfo.overdueDays,
        doses: historyInfo.doses,
        requiredDoses: historyInfo.requiredDoses,
        eligibilityReasons,
        unknownConditions
      }
    })
}

// -------------------------------------------------------
// Description builder
// -------------------------------------------------------

function buildDescription (prog, displayStatus, historyInfo) {
  const messages = prog.messages || {}

  switch (displayStatus) {
    case 'action-needed':
      if (historyInfo.status === 'overdue') {
        return messages.overdue
          ? messages.overdue(formatOverdueDays(historyInfo.overdueDays))
          : `Due ${formatOverdueDays(historyInfo.overdueDays)} ago`
      }
      if (historyInfo.status === 'never-had' && prog.type === 'screening') {
        return 'You have not had this screening before'
      }
      return prog.description

    case 'in-progress':
      return messages.partial
        ? messages.partial(historyInfo.doses, historyInfo.requiredDoses)
        : `${historyInfo.doses} of ${historyInfo.requiredDoses} doses given`

    case 'upcoming':
      return messages.upcoming
        ? messages.upcoming(formatRelativeDate(historyInfo.nextDueDate))
        : `Next due ${formatRelativeDate(historyInfo.nextDueDate)}`

    case 'unknown':
      return messages.checkEligibility
        || 'This may be available to you. We do not have enough information to confirm.'

    case 'up-to-date':
      if (messages.complete) {
        return typeof messages.complete === 'function'
          ? messages.complete(formatRelativeDate(historyInfo.lastDate))
          : messages.complete
      }
      if (prog.schedule.type === 'multi-dose') return 'All doses given'
      if (historyInfo.lastDate) return `You had this ${formatRelativeDate(historyInfo.lastDate)}`
      return 'Up to date'

    case 'opted-out':
      return 'You opted out of this'

    default:
      return ''
  }
}

function formatOverdueDays (days) {
  if (days < 30) return `${days} days`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? '1 month' : `${months} months`
  }
  const years = Math.floor(days / 365)
  return years === 1 ? '1 year' : `${years} years`
}

function formatRelativeDate (dateString, today = getToday()) {
  const date = new Date(dateString)
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Past dates
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays)
    if (absDays === 0) return 'today'
    if (absDays === 1) return 'yesterday'
    if (absDays < 7) return `${absDays} days ago`
    if (absDays < 30) {
      const weeks = Math.floor(absDays / 7)
      return weeks === 1 ? 'last week' : `${weeks} weeks ago`
    }
    if (absDays < 365) {
      const months = Math.floor(absDays / 30)
      return months === 1 ? 'last month' : `${months} months ago`
    }
    // More than a year ago - show month and year
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }

  // Future dates
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays < 7) return `in ${diffDays} days`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'in 1 week' : `in ${weeks} weeks`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? 'in 1 month' : `in ${months} months`
  }
  // More than a year away - show month and year
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// -------------------------------------------------------
// Exports
// -------------------------------------------------------

module.exports = {
  getToday,
  calculateAge,
  getProgrammesForPerson,
  checkAge,
  checkSex,
  checkConditions,
  checkHistory,
  formatOverdueDays,
  formatRelativeDate
}
