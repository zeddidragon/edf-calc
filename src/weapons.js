function populateWeaponStats(ch, cat) {
  const gameHasStars = [5, 6].includes(+active.game)
  const extra = document.getElementById('extra')
  const weaponTables = document.getElementById('weapon-tables')
  weaponTables.innerHTML = ''
  const weapons = table
    .filter(t => t.character === ch && t.category === cat)
    .map(w => {
      const obj = { ...w }
      if(w.category === 'core') {
        obj.baseEnergy = w.energy?.base || w.energy
      }
      for(const prop of scaledProps) {
        obj[prop] = getProp(w, prop, obj)
      }
      return obj
    })
    .flatMap(w => {
      if(w.attacks?.length && ch === 'bomber') { // Balam/Barga
        return [w,
          ...(w.weapons || []),
          ...w.attacks.map(atk => composeAttack(w, atk)),
        ]
      }
      if(w.attacks?.length) {
        return [
          { ...w, ...composeAttack(w, w.attacks[0]), name: w.name },
          ...w.attacks.slice(1).map(atk => composeAttack(w, atk)),
        ]
      }
      if(w.weapons) {
        return [w, ...w.weapons]
      }
      return [w]
    })
  window.weapons = weapons
  const category = charHeaders[ch].find(h => h.category === cat)
  const tables = category.tables || [category]
  for(const table of tables) {
    const thead = $('thead')
    const theadrow = $('tr')
    const weaponTable = $('table')
    const lang = active.lang || 'en'
    const wHeaders = table.headers
      .map(hd => {
        const header = headers.find(h => h.id === hd)
        if(!header) {
          throw new Error(`Header not found: ${hd}`)
        }
        return header
      })
    for(const header of wHeaders) {
      const cell = $('th')
      cell.setAttribute('title', header.tooltip || header.label)
      cell.textContent = header.label
      let cols = 1
      if(gameHasStars && header.starProp) {
        cols++
      }
      if(header.label === 'Dmg') {
        cols += 3
      }
      if(header.label === 'RoF') {
        cols += 1
      }
      if(cols > 1) {
        cell.setAttribute('colspan', cols)
      }
      if(header.headerClass) {
        cell.classList.add(header.headerClass)
      }
      theadrow.appendChild(cell)
    }
    thead.appendChild(theadrow)
    weaponTable.appendChild(thead)

    const tbody = $('tbody')
    for(const weapon of weapons) {
      if(table.subCategory && weapon.subCategory !== table.subCategory) {
        continue
      }
      const row = $('tr')
      for(const header of wHeaders) {
        const cell = $('td')
        let contents = header.cb(weapon, ch)
        cell.classList.add(header.label)
        if(header.headerClass) {
          cell.classList.add(header.headerClass)
        }
        row.appendChild(cell)

        if(header.label === 'Dmg') {
          const [dmg, count, count2] = contents.toString().split('x').map(v => v.trim())
          const [full, min] = dmg.split('~')

          if(min) {
            const cell = $('td')
            cell.textContent = min
            cell.classList.add('Falloff')
            row.appendChild(cell)
          } else {
            const cell = $('td')
            cell.classList.add('Filler')
            row.appendChild(cell)
          }

          if(count2) {
            const cell = $('td')
            cell.textContent = count2
            cell.classList.add('Count')
            row.appendChild(cell)
          }

          if(count) {
            const cell = $('td')
            cell.textContent = count
            cell.classList.add('Count')
            if(count2) {
              cell.classList.add('DmgEnd')
            }
            row.appendChild(cell)
          } else {
            const cell = $('td')
            cell.textContent = ''
            cell.classList.add('Filler')
            row.appendChild(cell)
          }

          if(!count2) {
            const cell = $('td')
            cell.textContent = ''
            cell.classList.add('Filler', 'DmgEnd')
            row.appendChild(cell)
          }

          cell.textContent = full

        } else if(header.label === 'RoF') {
          const [rof, burst] = contents.toString().split('x').map(v => v.trim())
          cell.textContent = rof
          if(burst) {
            const cell = $('td')
            cell.textContent = burst
            cell.classList.add('Count', 'DmgEnd')
            row.appendChild(cell)
          } else {
            const cell = $('td')
            cell.textContent = ''
            cell.classList.add('Filler', 'DmgEnd')
            row.appendChild(cell)
          }
        } else if(contents instanceof HTMLElement) {
          cell.appendChild(contents)
        } else {
          cell.textContent = contents
        }

        const prop = header.starProp
        const prop2 = header.starProp2
        if(gameHasStars && prop) {
          let colspan = 1
          cell.classList.add('hasStar')
          const starCell = $('td')
          for(let i = 0; i < 2; i++) {
            const p = [prop, prop2][i]
            const star = weapon[`${p}Star`]
            const max = weapon[`${p}StarMax`]
            if(star == null && i === 0) {
              colspan = 2
            } else if(star == null) {
            } else if(star < max) {
              starCell.textContent += `☆${star}`
            } else {
              starCell.textContent += `★${star}`
            }
          }

          starCell.classList.add('isStar')
          row.appendChild(starCell)
        }
      }
      tbody.appendChild(row)
    }
    /*
    if(ch === 'ranger' && cat === 'special') {
      extra.innerHTML = '*Assuming flame hits every frame of duration.'
    } else if(cat === 'support') {
      extra.innerHTML = '*All ammo combined'
    } else if(cat === 'deploy') {
      extra.innerHTML = '*All sentries combined'
    } else if(ch !== 'winger' && cat === 'missile') {
      extra.innerHTML = '*With 0 lock time'
    } else {
      extra.innerHTML = ''
    }
    */
    if(tables.length > 1) {
      const name = localize(table.names)
      const h = $('h3')
      h.textContent = name
      weaponTables.appendChild(h)
    }

    weaponTable.appendChild(tbody)
    weaponTables.appendChild(weaponTable)
    if(table.appendix) {
      const extra = $('p')
      extra.textContent = table.appendix
      weaponTables.appendChild(extra)
    }
  }
}
