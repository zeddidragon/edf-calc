let weapon = {}

async function loadWeapon(game, id) {
  document.getElementById('weapon-editor').innerHTML = template({})
  return
  const response = await fetch(`https://raw.githubusercontent.com/zeddidragon/sgott/refs/heads/master/data/${game}/weapon/${id}.json`)
  const data = await response.json()
  renderWeapon(data)
}

function renderWeapon(data, coords=[]) {
  console.log(data)
  document.getElementById('weapon-editor').innerHTML = `<table>
      <thead>
        <tr><th>Name</th><th>Type</th><th>Value</th></tr>
      </thead>
      <tbody>
        <tr><td>Format</td><td></td><td>${data.format}</td></tr>
        <tr><td>Endian</td><td></td><td>${data.endian}</td></tr>
        ${renderValue(data.variables, 'root', 'Weapon', data, [...coords])}
      </tbody>
    </table>`

}

function renderValue(value, type, name, data, coords) {
  if(typeof value === 'string') {
    return value
  } else if(!isNaN(value)) {
    return value
  }
  if(Array.isArray(value)) {
    return `${name || '[Unnamed Object]'}</td></tr>
    ` + value.map(({ value: v2, type, name }, i) => {
      return `<tr>
        ${coords.map(() => `<td></td>`).join('')}
        <td>${name || `#${i + 1}`}</td>
        <td>${type}</td>
        <td>${renderValue(v2, type, name, data, [...coords, i])}</td>
      </tr>`
    }).join('\n') + `
      <tr><td></td><td>
    `
  }
  console.error({ value, type, name, coords })
  return 'What????'
}

loadWeapon(6, "ASSULTRIFLE01")
