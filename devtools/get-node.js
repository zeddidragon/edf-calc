export function splatNode(nodes) {
  if(nodes == null)
    return null;

  if(!nodes.length)
    return null;

  const obj = {}
  let wasKey = false
  
  const arr = nodes.map((node, i) => {
    const key = node.name || i
    wasKey ||= !!node.name
    switch(node.type) {
      case 'ptr':
        obj[key] = splatNode(node.value)
        break
      default:
        obj[key] = node.value
    }
    return obj[key]
  })
  return wasKey ? obj : arr
}

export function getNode(template, name) {
  return template.variables.find(n => n.name === name)
}
