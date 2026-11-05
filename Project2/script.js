
const API_URL =
    "https://site.api.espn.com/apis/v2/sports/football/nfl/standings";

// HTML elements
const fetchButton = document.getElementById("fetchButton");
const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");

const teamContainer = document.getElementById("teamContainer");
const standingsBody = document.getElementById("standingsBody");
const message = document.getElementById("message");

let allTeams = [];
const afcTeams = [
    "BUF", "MIA", "NE", "NYJ",
    "BAL", "CIN", "CLE", "PIT",
    "HOU", "IND", "JAX", "TEN",
    "DEN", "KC", "LV", "LAC"
];

const nfcTeams = [
    "DAL", "NYG", "PHI", "WAS",
    "CHI", "DET", "GB", "MIN",
    "ATL", "CAR", "NO", "TB",
    "ARI", "LA", "SF", "SEA"
];
// Fetch NFL data from ESPN
async function fetchNFLData() {

    message.textContent = "Loading NFL data...";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to retrieve NFL data.");
        }

        const data = await response.json();

        // Find all division standings in the API response
        const teams = [];

        function findTeams(node, path = []) {

            if (!node || typeof node !== "object") {
                return;
            }

            const currentPath = node.name
                ? [...path, node.name]
                : path;

            if (node.standings &&
                Array.isArray(node.standings.entries)) {

                node.standings.entries.forEach(entry => {

                    teams.push({
                        team: entry.team,
                        stats: entry.stats || [],
                        group: currentPath.join(" ")
                    });

                });
            }

            // Search nested conference and division data
            if (Array.isArray(node.children)) {
                node.children.forEach(child => {
                    findTeams(child, currentPath);
                });
            }
        }

        findTeams(data);

        // Remove duplicate teams
        const uniqueTeams = [
            ...new Map(
                teams.map(item => [item.team.id, item])
            ).values()
        ];

        if (uniqueTeams.length === 0) {
            throw new Error("No team information was found.");
        }

        allTeams = uniqueTeams;

        displayTeams(allTeams);
        displayStandings(allTeams);

        message.textContent =
            `Successfully loaded ${allTeams.length} NFL teams!`;

    } catch (error) {

        message.textContent =
            "Error: " + error.message;

        teamContainer.textContent =
            "Unable to load teams. Please try again.";

        standingsBody.replaceChildren();

        console.error(error);
    }
}

// Get a statistic from a team's data
function getStat(team, statName) {

    const stat = team.stats.find(
        item => item.name === statName
    );

    return stat ? stat.displayValue : "0";
}

// Get the conference and division
function getConference(team) {
    const abbreviation = team.team.abbreviation;

    if (afcTeams.includes(abbreviation)) {
        return "AFC";
    }

    if (nfcTeams.includes(abbreviation)) {
        return "NFC";
    }

    return "Unknown";
}

// Display NFL team cards
function displayTeams(teams) {
    teamContainer.replaceChildren();

    teams.forEach(item => {
        const team = item.team;

        const card = document.createElement("div");
        card.className = "team-card";

        const logo = document.createElement("img");

        const logoUrl =
            team.logos?.[0]?.href ||
            team.logo ||
            `https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbreviation.toLowerCase()}.png`;

        logo.src = logoUrl;
        logo.alt = team.displayName + " logo";

        const name = document.createElement("h3");
        name.textContent = team.displayName;

        const abbreviation = document.createElement("p");
        abbreviation.textContent = "Team: " + team.abbreviation;

        const conference = document.createElement("p");
        conference.textContent = "Conference: " + getConference(item);

        const recordText = document.createElement("p");
        recordText.textContent =
            "Record: " +
            getStat(item, "wins") + "-" +
            getStat(item, "losses") + "-" +
            getStat(item, "ties");

        card.append(
            logo,
            name,
            abbreviation,
            conference,
            recordText
        );

        teamContainer.appendChild(card);
    });
}

// Display NFL standings
function displayStandings(teams) {
    standingsBody.replaceChildren();

    const sortedTeams = [...teams].sort((a, b) => {
        const conferenceA = getConference(a);
        const conferenceB = getConference(b);

        if (conferenceA !== conferenceB) {
            return conferenceA.localeCompare(conferenceB);
        }

        return Number(getStat(b, "wins")) -
               Number(getStat(a, "wins"));
    });

    sortedTeams.forEach(item => {
        const team = item.team;

        const row = document.createElement("tr");

        const values = [
            team.displayName,
            getConference(item),
            getStat(item, "wins"),
            getStat(item, "losses"),
            getStat(item, "ties"),
            getStat(item, "winPercent")
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        standingsBody.appendChild(row);
    });
}

// Search for a specific NFL team
async function searchTeam() {

    const searchValue = searchInput.value
        .trim()
        .toLowerCase();

    if (!searchValue) {

        message.textContent =
            "Please enter a team name to search.";

        return;
    }

    // Fetch current API data for the search
    message.textContent = "Searching for team...";

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to search NFL teams.");
        }

        const data = await response.json();

        const teams = [];

        function findTeams(node, path = []) {

            if (!node || typeof node !== "object") {
                return;
            }

            const currentPath = node.name
                ? [...path, node.name]
                : path;

            if (node.standings &&
                Array.isArray(node.standings.entries)) {

                node.standings.entries.forEach(entry => {

                    teams.push({
                        team: entry.team,
                        stats: entry.stats || [],
                        group: currentPath.join(" ")
                    });

                });
            }

            if (Array.isArray(node.children)) {
                node.children.forEach(child => {
                    findTeams(child, currentPath);
                });
            }
        }

        findTeams(data);

        const foundTeam = teams.find(item => {

            const name = item.team.name.toLowerCase();

            const abbreviation =
                item.team.abbreviation.toLowerCase();
            const location =
                item.team.location.toLowerCase();
            const displayName =
                item.team.displayName.toLowerCase();

            return name === searchValue ||
                   abbreviation === searchValue ||
                   location === searchValue ||
                   displayName === searchValue;
        });

        if (foundTeam) {

            allTeams = teams;

            displayTeams([foundTeam]);
            displayStandings([foundTeam]);

            message.textContent =
                "Found: " + foundTeam.team.displayName;

        } else {

            teamContainer.replaceChildren();
            standingsBody.replaceChildren();

            message.textContent =
                "Team not found. Check the spelling and try again.";

        }

    } catch (error) {

        message.textContent =
            "Search error: " + error.message;

    }
}

// Button event listeners
fetchButton.addEventListener("click", fetchNFLData);

searchButton.addEventListener("click", searchTeam);

// Allow Enter to search
searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchTeam();
    }

});
