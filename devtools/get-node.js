export function getNode(template, name) {
  return template.variables.find(n => n.name === name)
}
