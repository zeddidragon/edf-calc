export localize = (prop, fallback) =>
  unless prop
    return fallback or null
  if typeof prop is 'string'
    return prop
  if prop[locals.lang.id]?
    return prop[locals.lang.id]
  if fallback?
    return fallback
  Object.values(prop)[0]
