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

/**
 * Check if today falls within a seasonal window (MM-DD to MM-DD).
 * Handles year boundary crossing (e.g. "09-01" to "03-31").
 */
function checkSeasonalWindow (programme, today = getToday()) {
  if (!programme.seasonalWindow) return true
  const { start, end } = programme.seasonalWindow
  const [startMonth, startDay] = start.split('-').map(Number)
  const [endMonth, endDay] = end.split('-').map(Number)
  const month = today.getMonth() + 1
  const day = today.getDate()

  const todayVal = month * 100 + day
  const startVal = startMonth * 100 + startDay
  const endVal = endMonth * 100 + endDay

  if (startVal <= endVal) {
    // Same year: e.g. 03-01 to 06-30
    return todayVal >= startVal && todayVal <= endVal
  } else {
    // Crosses year boundary: e.g. 09-01 to 03-31
    return todayVal >= startVal || todayVal <= endVal
  }
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

const conditionQuestions = {
  diabetes: 'Do you have diabetes?',
  smoker: 'Do you currently smoke?',
  exSmoker: 'Have you smoked in the past?',
  pregnant: 'Are you currently pregnant?',
  clinicalRiskGroup: 'Do you have a long-term health condition?',
  carer: 'Are you an unpaid carer?',
  immunosuppressed: 'Do you have a weakened immune system?',
  careHomeResident: 'Do you live in a care home?'
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

function getUnknownConditionKeys (person, eligibility) {
  if (!eligibility.conditions) return []
  const personConditions = person.conditions || {}
  return eligibility.conditions.required
    .filter(cond => personConditions[cond] === undefined)
}

// -------------------------------------------------------
// Overdue: days since person became eligible
// -------------------------------------------------------

/**
 * Calculate how many days since a person first became eligible,
 * based on DOB and the programme's minimum age.
 */
function getDaysSinceEligible (person, eligibility, today = getToday()) {
  if (!person.dateOfBirth) return null
  const dob = new Date(person.dateOfBirth)
  const eligibleDate = new Date(dob)
  eligibleDate.setFullYear(eligibleDate.getFullYear() + eligibility.age.min)
  const diffTime = today - eligibleDate
  if (diffTime < 0) return null
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// -------------------------------------------------------
// Prerequisite checks
// -------------------------------------------------------

/**
 * Check whether prerequisite programmes have been completed.
 * Returns true if all required programmes have a past lastDate.
 */
function checkRequires (person, eligibility, today = getToday()) {
  if (!eligibility.requires || !eligibility.requires.length) return true
  const history = person.history || {}
  return eligibility.requires.every(progId => {
    const entry = history[progId]
    if (!entry || !entry.lastDate) return false
    return new Date(entry.lastDate) <= today
  })
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
  const isInFuture = lastDate > today

  // Future date = booked appointment, regardless of schedule type
  if (isInFuture) {
    return {
      status: 'booked',
      lastDate: history.lastDate
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
 *   "action-needed"     — book now (due but within grace period)
 *   "overdue"           — past the programme's overdueDays grace period
 *   "upcoming"          — not due yet, but will be
 *   "unknown"           — we don't have enough data to confirm
 *   "up-to-date"        — complete and not due again yet
 *   "expired"           — overdue beyond the programme's expiryDays
 *   "opted-out"         — user has opted out
 */
function getProgrammesForPerson (person, programmes, today = getToday()) {
  const age = person.dateOfBirth
    ? calculateAge(person.dateOfBirth, today)
    : person.age

  const results = []

  for (const prog of programmes) {
    if (!checkSeasonalWindow(prog, today)) continue
    if (!checkSex(person, prog.eligibility)) continue
    if (!checkRequires(person, prog.eligibility, today)) continue

    // Exclude if any exclude condition is confirmed true
    if (prog.eligibility.excludeConditions) {
      const personConditions = person.conditions || {}
      const excluded = prog.eligibility.excludeConditions.some(cond => personConditions[cond] === true)
      if (excluded) continue
    }

    // Only show if the person has opted out of the specified programme
    if (prog.eligibility.requiresOptOut) {
      const optOutHistory = person.history && person.history[prog.eligibility.requiresOptOut]
      if (!optOutHistory || !optOutHistory.optedOut) continue
    }

    // Max age is always enforced
    const { min, max } = prog.eligibility.age
    if (max !== null && age > max) continue

    // Min age can be bypassed by conditions in 'or' mode
    const minAgeOk = age >= min
    const conditionResult = checkConditions(person, prog.eligibility)

    if (!prog.eligibility.conditions) {
      if (!minAgeOk) continue
    } else if (prog.eligibility.conditions.mode === 'and') {
      // Both age and conditions required
      if (conditionResult === 'ineligible' || !minAgeOk) continue
    } else {
      // 'or' mode: age alone OR conditions alone can qualify
      if (conditionResult === 'ineligible' && !minAgeOk) continue
    }

    const historyInfo = checkHistory(person, prog, today)

    // Single if/else chain for display status
    let displayStatus
    if (historyInfo.status === 'opted-out') {
      displayStatus = 'opted-out'
    } else if (conditionResult === 'unknown' &&
               (prog.eligibility.conditions.mode === 'and' || !minAgeOk || prog.eligibility.requireConditions)) {
      displayStatus = 'unknown'
    } else if (historyInfo.status === 'overdue' && prog.schedule.expiryDays &&
               historyInfo.overdueDays > prog.schedule.expiryDays) {
      displayStatus = 'expired'
    } else if (historyInfo.status === 'never-had' || historyInfo.status === 'overdue') {
      // Check if past the programme's overdue grace period
      if (prog.overdueDays && historyInfo.status === 'overdue') {
        // Recurring programme past its interval — always overdue
        displayStatus = 'overdue'
      } else if (prog.overdueDays && historyInfo.status === 'never-had') {
        // Never had: check if eligible for longer than the grace period
        const daysSinceEligible = getDaysSinceEligible(person, prog.eligibility, today)
        if (daysSinceEligible !== null && daysSinceEligible > prog.overdueDays) {
          displayStatus = 'overdue'
          historyInfo.overdueDays = daysSinceEligible
        } else {
          displayStatus = 'action-needed'
        }
      } else {
        displayStatus = 'action-needed'
      }
    } else if (historyInfo.status === 'booked') {
      displayStatus = 'booked'
    } else if (historyInfo.status === 'upcoming') {
      displayStatus = 'upcoming'
    } else {
      displayStatus = 'up-to-date'
    }

    results.push({
      id: prog.id,
      name: prog.name,
      type: prog.type,
      description: prog.description,
      displayStatus,
      statusText: buildDescription(prog, displayStatus, historyInfo),
      lastDate: historyInfo.lastDate,
      nextDueDate: historyInfo.nextDueDate,
      overdueDays: historyInfo.overdueDays,
      eligibilityReasons: getEligibilityReasons(person, prog.eligibility),
      unknownConditions: getUnknownConditions(person, prog.eligibility)
    })
  }

  return results
}

// -------------------------------------------------------
// Description builder
// -------------------------------------------------------

function buildDescription (prog, displayStatus, historyInfo) {
  const messages = prog.messages || {}

  switch (displayStatus) {
    case 'overdue':
      if (historyInfo.status === 'overdue' && historyInfo.overdueDays) {
        return messages.overdue
          ? messages.overdue(formatOverdueDays(historyInfo.overdueDays))
          : `Due ${formatOverdueDays(historyInfo.overdueDays)} ago`
      }
      if (prog.type === 'screening') {
        return 'You have not had this check before'
      }
      return prog.description

    case 'action-needed':
      if (prog.seasonalWindow) {
        return `Available until ${formatSeasonalDateWithYear(prog.seasonalWindow.start, prog.seasonalWindow.end, 'end')}`
      }
      if (historyInfo.status === 'overdue') {
        return messages.overdue
          ? messages.overdue(formatOverdueDays(historyInfo.overdueDays))
          : `Due ${formatOverdueDays(historyInfo.overdueDays)} ago`
      }
      if (historyInfo.status === 'never-had' && prog.type === 'screening') {
        return 'You have not had this check before'
      }
      return prog.description

    case 'booked':
      return nbsp(new Date(historyInfo.lastDate)
        .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        .replace(',', ''))

    case 'upcoming':
      return messages.upcoming
        ? messages.upcoming(formatRelativeDate(historyInfo.nextDueDate))
        : `Next due ${formatRelativeDate(historyInfo.nextDueDate)}`

    case 'unknown':
      return messages.checkEligibility
        || 'This may be available to you.'

    case 'up-to-date':
      if (messages.complete) {
        return typeof messages.complete === 'function'
          ? messages.complete(formatRelativeDate(historyInfo.lastDate))
          : messages.complete
      }
      if (historyInfo.lastDate) return `You had this ${formatRelativeDate(historyInfo.lastDate)}`
      return 'Up to date'

    case 'expired':
      return `Was due ${formatOverdueDays(historyInfo.overdueDays)} ago — no longer showing to user`

    case 'opted-out':
      return 'You opted out of this'

    default:
      return ''
  }
}

function nbsp (str) {
  return str.replace(/ /g, '\u00a0')
}

function formatSeasonalDateWithYear (startMmdd, endMmdd, which, today = getToday()) {
  const mmdd = which === 'start' ? startMmdd : endMmdd
  const [month, day] = mmdd.split('-').map(Number)
  const [startMonth] = startMmdd.split('-').map(Number)
  const [endMonth] = endMmdd.split('-').map(Number)

  let year = today.getFullYear()
  const crossesYear = startMonth > endMonth

  if (crossesYear) {
    const todayMonth = today.getMonth() + 1
    if (which === 'start' && todayMonth <= endMonth) {
      year = year - 1
    } else if (which === 'end' && todayMonth >= startMonth) {
      year = year + 1
    }
  }

  const date = new Date(year, month - 1, day)
  return nbsp(date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
}

function formatOverdueDays (days) {
  if (days < 30) return nbsp(`${days} days`)
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? nbsp('1 month') : nbsp(`${months} months`)
  }
  const years = Math.floor(days / 365)
  return years === 1 ? nbsp('1 year') : nbsp(`${years} years`)
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
    if (absDays < 7) return nbsp(`${absDays} days ago`)
    if (absDays < 30) {
      const weeks = Math.floor(absDays / 7)
      return weeks === 1 ? nbsp('last week') : nbsp(`${weeks} weeks ago`)
    }
    if (absDays < 365) {
      const months = Math.floor(absDays / 30)
      return months === 1 ? nbsp('last month') : nbsp(`${months} months ago`)
    }
    // More than a year ago - show month and year
    return nbsp(date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))
  }

  // Future dates
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays < 7) return nbsp(`in ${diffDays} days`)
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? nbsp('in 1 week') : nbsp(`in ${weeks} weeks`)
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? nbsp('in 1 month') : nbsp(`in ${months} months`)
  }
  // More than a year away - show month and year
  return nbsp(date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))
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
  checkRequires,
  checkHistory,
  formatOverdueDays,
  formatRelativeDate,
  conditionQuestions,
  getUnknownConditionKeys
}
