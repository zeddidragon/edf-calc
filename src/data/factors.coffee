missions = require './missions'
{dlc1, dlc2} = require './dlc.coffee'
missions.dlc1 = dlc1
missions.dlc2 = dlc2

factors = [
    { min:  0.5, max:  1.5 },
    { min:  1.0, max:  2.5 },
    { min:  3.0, max:  5.8 },
    { min:  7.0, max: 15.0 },
    { min: 16.0, max: 28.0 },
  ]

campaigns = [
      id: 'offline',
      missions: missions.campaign.filter (m) -> not m.online
      difficulties: factors
    ,
      id: 'online',
      missions: missions.campaign
      difficulties: factors
    ,
      id: 'dlc1',
      missions: missions.dlc1
      difficulties: [
          { min:  1.25, max:  2.0 },
          { min:  1.75, max:  3.0 },
          { min:  4.40, max:  7.0 },
          { min: 11.00, max: 16.0 },
          { min: 22.00, max: 28.0 },
        ]
    ,
      id: 'dlc2',
      missions: missions.dlc2
      difficulties: [
          { min:  1.25, max:  2.5 },
          { min:  1.75, max:  4.4 },
          { min:  4.40, max: 11.0 },
          { min: 11.00, max: 22.0 },
          { min: 22.00, max: 33.0 },
        ]
  ]

module.exports = campaigns
