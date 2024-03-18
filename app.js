const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
let db = null

let dbPath = path.join(__dirname, 'cricketMatchDetails.db')

const intializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
  }
}
intializeDbServer()

const convertDbobject = dbObject => {
  return {playerId: dbObject.player_id, playerName: dbObject.player_name}
}

//GET Method
app.get('/players/', async (request, response) => {
  const resultQuery = `SELECT * FROM 
                            player_details`
  const result = await db.all(resultQuery)
  response.send(result.map(eachPlayer => convertDbobject(eachPlayer)))
})

//API- 2 GET single player
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const resultQuery = `SELECT * FROM player_details 
                      WHERE player_id = ${playerId}`
  const result = await db.get(resultQuery)
  response.send(convertDbobject(result))
})
const convertMatchdbObj = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}
//API -3 PUT request
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerName = request.body

  const resultQuery = `UPDATE player_details
                        SET 
                        player_name="${playerName}"
                        WHERE 
                        player_id=${playerId}`
  await db.run(resultQuery)
  response.send('Player Details Updated')
})

//API-4 GET Matches
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const resultQuery = `SELECT * FROM match_details
                        WHERE match_id = ${matchId}`
  const result = await db.get(resultQuery)
  response.send(convertMatchdbObj(result))
})

//GET API 5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const resultQuery = `SELECT match_details.match_id AS matchId,
                match AS match,
                year AS year
   FROM player_match_score INNER JOIN 
                    match_details ON player_match_score.match_id=match_details.match_id
                    WHERE player_id =${playerId}`
  const result = await db.all(resultQuery)
  response.send(result)
})

//API 6 GET
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const resultQuery = `SELECT DISTINCT(player_id) AS playerId,
                              player_name AS playerName
                               FROM 
                      player_match_score NATURAL JOIN player_details`

  const result = await db.all(resultQuery)
  response.send(result)
})

//API 7 GET

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const resultQuery = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`

  const result = await db.all(resultQuery)
  response.send(result)
})

module.exports = app
