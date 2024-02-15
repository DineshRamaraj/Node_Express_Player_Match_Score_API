const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

let database = null;

initializationDbAndServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "cricketMatchDetails.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializationDbAndServer();

const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// GET Players API

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
        *
    FROM
        player_details;`;

  const dbResponse = await database.all(getPlayersQuery);
  response.send(
    dbResponse.map((dbObject) => convertPlayerObjectToResponseObject(dbObject))
  );
});

// GET Player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId};`;

  const dbResponse = await database.get(getPlayerQuery);
  response.send(convertPlayerObjectToResponseObject(dbResponse));
});

// PUT Player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  //   console.log(playerName);
  const updatePlayerQuery = `
      UPDATE
          player_details
      SET
          player_name = '${playerName}'
      WHERE
          player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// GET Match API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};`;

  const dbResponse = await database.get(getMatchQuery);
  response.send(convertMatchObjectToResponseObject(dbResponse));
});

// GET Players And Matches API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const dbResponse = await database.all(getMatchQuery);
  response.send(
    dbResponse.map((dbObject) => convertMatchObjectToResponseObject(dbObject))
  );
});

// GET Matches And Players API

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

// GET Players AND PlayerScore API

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(score) AS totalScore, 
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM
        player_details 
    NATURAL JOIN 
        player_match_score 
    WHERE
        player_id = ${playerId}`;

  const dbResponse = await database.get(getMatchQuery);
  response.send(dbResponse);
});

module.exports = app;
