module.exports = function (env) { /* eslint-disable-line func-names,no-unused-vars */
  const filters = {};

  /* ------------------------------------------------------------------
    add your methods to the filters obj below this comment block:
    @example:

    filters.sayHi = function(name) {
        return 'Hi ' + name + '!'
    }

    Which in your templates would be used as:

    {{ 'Paul' | sayHi }} => 'Hi Paul'

    Notice the first argument of your filters method is whatever
    gets 'piped' via '|' to the filter.

    Filters can take additional arguments, for example:

    filters.sayHi = function(name,tone) {
      return (tone == 'formal' ? 'Greetings' : 'Hi') + ' ' + name + '!'
    }

    Which would be used like this:

    {{ 'Joel' | sayHi('formal') }} => 'Greetings Joel!'
    {{ 'Gemma' | sayHi }} => 'Hi Gemma!'

    For more on filters and how to write them see the Nunjucks
    documentation.

  ------------------------------------------------------------------ */

  // Format a date string (YYYY-MM-DD) to a readable format (e.g., "15 March 2024")
  filters.formatDate = function (dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const options = { day: 'numeric', month: 'long', year: 'numeric' }
    return date.toLocaleDateString('en-GB', options)
  }

  // Format overdue duration (e.g., "2 months overdue", "1 year overdue")
  filters.formatOverdue = function (overdueBy) {
    if (!overdueBy || !overdueBy.days) return ''

    const days = overdueBy.days
    if (days < 7) return days + ' day' + (days === 1 ? '' : 's') + ' overdue'
    if (days < 30) {
      const weeks = Math.floor(days / 7)
      return weeks + ' week' + (weeks === 1 ? '' : 's') + ' overdue'
    }
    if (days < 365) {
      const months = Math.floor(days / 30)
      return months + ' month' + (months === 1 ? '' : 's') + ' overdue'
    }
    const years = Math.floor(days / 365)
    return years + ' year' + (years === 1 ? '' : 's') + ' overdue'
  }

  // Format a date string relative to today (e.g., "2 months ago", "in 3 weeks")
  filters.relativeDate = function (dateString) {
    if (!dateString) return ''

    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    const diffTime = date - today
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    // Past dates
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays)
      if (absDays === 1) return 'yesterday'
      if (absDays < 7) return absDays + ' days ago'
      if (absDays < 14) return '1 week ago'
      if (absDays < 30) return Math.floor(absDays / 7) + ' weeks ago'
      if (absDays < 60) return '1 month ago'
      if (absDays < 365) return Math.floor(absDays / 30) + ' months ago'
      if (absDays < 730) return '1 year ago'
      return Math.floor(absDays / 365) + ' years ago'
    }

    // Future dates
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'tomorrow'
    if (diffDays < 7) return 'in ' + diffDays + ' days'
    if (diffDays < 14) return 'in 1 week'
    if (diffDays < 30) return 'in ' + Math.floor(diffDays / 7) + ' weeks'
    if (diffDays < 60) return 'in 1 month'
    if (diffDays < 365) return 'in ' + Math.floor(diffDays / 30) + ' months'
    if (diffDays < 730) return 'in 1 year'
    return 'in ' + Math.floor(diffDays / 365) + ' years'
  }

  // Replace whitespace with non-breaking spaces
  // {{ "1 September 2025" | nbsp }} => "1&nbsp;September&nbsp;2025"
  filters.nbsp = function (str) {
    if (!str) return ''
    return str.replace(/ /g, '\u00a0')
  }

  /* keep the following line to return your filters to the app  */
  return filters;
};
