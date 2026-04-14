accuracyTable = [
  [0.0005, 'S++']
  [0.0025, 'S+']
  [0.01, 'A+']
  [0.014999, 'A']
  [0.02, 'A-']
  [0.03, 'B+']
  [0.05, 'B']
  [0.10, 'B-']
  [0.15, 'C+']
  [0.20, 'C']
  [0.24998, 'C-']
  [0.3, 'D']
  [0.4, 'E']
  [0.5, 'F']
  [0.6, 'G']
  [0.8, 'I']
  [1.0, 'J']
  [1.2, 'K']
  [1.6, 'L']
  [Infinity, 'Z']
]

export accuracy = (wpn) =>
  if wpn.accuracyRank then switch (rank = wpn.accuracyRank)
    when 'horizontal' then '↔'
    when 'vertical' then '↕'
    when 'circle' then '○'
    when 'spherical' then 'Sphere'
    when 'downward' then 'Down'
    else rank
  else if wpn.speed and wpn.accuracy?
    accuracyTable.find(([a]) => a >= wpn.accuracy)[1]

