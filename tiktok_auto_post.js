import fetch from "node-fetch";

const clientKey = 'awtk9q11ll2kqoe1';
const clientSecret = 'Frrdb0ZJUjCh7hXtEc9VinH1rr6ysnjk';
let accessToken = '';

const postedMatches = new Set();
let matchIndex = 0;
let autopostData;

async function getAccessToken() {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        'client_key': clientKey,
        'client_secret': clientSecret,
        'grant_type': 'client_credentials',
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      accessToken = data.access_token;
      console.log('Access token obtained:', accessToken);
    } else {
      console.error('Failed to obtain access token:', data);
    }
  } catch (error) {
    console.error('Error obtaining access token:', error);
  }
}

async function fetchData() {
  try {
    const response = await fetch(
      "https://sportscore.io/api/v1/football/matches/?match_status=live&sort_by_time=false&page=0",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": "uqzmebqojezbivd2dmpakmj93j7gjm",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    processData(data.match_groups);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchAutopost() {
  try {
    const response = await fetch('https://sportscore.io/api/v1/autopost/settings/tiktok/', {
      method: 'GET',
      headers: {
        "accept": "application/json",
        'X-API-Key': 'uqzmebqojezbivd2dmpakmj93j7gjm',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch autopost data: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    autopostData = data;
  } catch (error) {
    console.error('Error fetching autopost data:', error);
  }
}

async function processData(matchGroups) {
  try {
    if (!Array.isArray(matchGroups)) {
      console.error("Invalid matchGroups:", matchGroups);
      return;
    }

    await fetchAutopost();
    console.log(autopostData);
    
    if (autopostData[1].enabled) {
      matchGroups.forEach((matchGroup) => {
        getMatch(matchGroup);
      });
    }
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

async function getMatch(matchGroup) {
  try {
    const competition = matchGroup.competition.name;

    matchGroup.matches.forEach((match) => {
      const matchId = match.id;

      if (!postedMatches.has(matchId)) {
        const homeTeam = match.home_team.name;
        const awayTeam = match.away_team.name;
        const league = competition;
        const matchLink = match.url;
        const photoLink = match.social_picture;
        const hashtags = `#${homeTeam.replace(/\s+/g, '')} #${awayTeam.replace(/\s+/g, '')} #${league.replace(/\s+/g, '')}`;
        
        let postContent = `💥⚽️💥 ${homeTeam} vs ${awayTeam} League: ${league} 💥⚽️💥<br>`;
        postContent += `Watch Now on SportScore: ${matchLink}`;              

        // Post to TikTok after 1 minute interval
        setTimeout(() => {
          postToTikTok(postContent, photoLink);
        }, matchIndex * 60000); // Adjusted interval based on matchIndex

        // Add matchId to the set to avoid reposting
        postedMatches.add(matchId);
        matchIndex++;
      }
    });
  } catch (error) {
    console.error("Error getting match:", error.message);
  }
}

async function postToTikTok(postText, photoLink) {
  let accessToken = "act.6zL3asprBntsIbvpRucDB2Qtb8frioyrLUsQuLpvcLtI63nFERoshiiF7Gc3!6258.va";
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "post_info": {
            "title": "🎌Match Started!🎌",
            "description": postText,
            "disable_comment": false,
            "privacy_level": "PUBLIC_TO_EVERYONE",
            "auto_add_music": true
        },
        "source_info": {
            "source": "PULL_FROM_URL",
            "photo_cover_index": 1,
            "photo_images": [
                photoLink
            ]
        },
        "post_mode": "DIRECT_POST",
        "media_type": "PHOTO"
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to post to TikTok: ${response} - ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log("Post successful:", responseData);
  } catch (error) {
    console.error("Error posting to TikTok:", error);
  }
}

// getAccessToken().then(fetchData);
fetchData();

setInterval(fetchData, 60000);
