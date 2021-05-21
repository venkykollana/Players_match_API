const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is running on http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeServerAndDatabase();

const convertMatchDetailsTableDbToRequired = (list) => {
  return {
    matchId: list.match_id,
    match: list.match,
    year: list.year,
  };
};

const convertPlayerDetailsTableDbToRequired = (list) => {
  return {
    playerId: list.player_id,
    playerName: list.player_name,
  };
};

const convertPlayerMatchScoreDetailsTableDbToRequired = (list) => {
  return {
    playerMatchId: list.player_match_id,
    playerId: list.player_id,
    matchId: list.match_id,
    score: list.score,
    fours: list.fours,
    sixes: list.sixes,
  };
};

//API-1
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT 
        *
    FROM 
        player_details;`;
  const playerDetails = await db.all(getAllPlayersQuery);
  response.send(
    playerDetails.map((eachPlayer) =>
      convertPlayerDetailsTableDbToRequired(eachPlayer)
    )
  );
});

//API-2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
        *
    FROM 
        player_details
    WHERE 
        player_id = ${playerId};`;
  const playerDetails = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsTableDbToRequired(playerDetails));
});

//API-3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putQuery = `
    UPDATE 
        player_details
    SET 
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
    `;
  await db.run(putQuery);
  response.send("Player Details Updated");
});

//API-4
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT 
        *
    FROM
        match_details 
    WHERE 
        match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsTableDbToRequired(matchDetails));
});

//API-5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsQuery = `
    SELECT 
        match_details.match_id,
        match_details.match,
        match_details.year
    FROM 
        match_details 
        INNER JOIN 
        player_match_score
        ON match_details.match_id = player_match_score.match_id 
    WHERE 
        player_match_score.player_id = ${playerId};
        `;
  const matchDetails = await db.all(getMatchDetailsQuery);
  response.send(
    matchDetails.map((eachMatch) =>
      convertMatchDetailsTableDbToRequired(eachMatch)
    )
  );
});

//API-6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsQuery = `
    SELECT 
        player_details.player_id,
        player_details.player_name
    FROM 
        player_details 
        INNER JOIN 
        player_match_score
        ON player_details.player_id = player_match_score.player_id 
    WHERE 
        player_match_score.match_id = ${matchId};
        `;
  const playerDetails = await db.all(getPlayerDetailsQuery);
  response.send(
    playerDetails.map((eachPlayer) =>
      convertPlayerDetailsTableDbToRequired(eachPlayer)
    )
  );
});

//API-7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreDetailsQuery = `
    SELECT 
        player_id AS playerId,
        player_name  AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_details 
        NATURAL JOIN 
        player_match_score
    WHERE 
        player_id = ${playerId};
        `;
  const playerScoreDetails = await db.get(getPlayerScoreDetailsQuery);
  response.send(playerScoreDetails);
});

module.exports = app;
