import fetch from "node-fetch";
import OAuth from "oauth";
import sharp from "sharp";

const clientKey = 'awtk9q11ll2kqoe1';
const clientSecret = 'Frrdb0ZJUjCh7hXtEc9VinH1rr6ysnjk';
const accessToken = '';

const tumblrBlogIdentifier = 'sportscore-io.tumblr.com';

const postedMatches = new Set();
let matchIndex = 0;
let autopostData;

// Function to obtain access token using client credentials grant
async function getAccessToken() {
  try {
    const response = await fetch('https://open-api.tiktok.com/oauth/client_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'ttd.read ttd.write',
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

// Function to fetch autopost settings
async function fetchAutopost() {
  try {
    const response = await fetch('https://sportscore.io/api/v1/autopost/settings/tumblr/', {
      method: 'GET',
      headers: {
        "accept": "application/json",
        'X-API-Key': 'uqzmebqojezbivd2dmpakmj93j7gjm',
      },
    });
    const data = await response.json();
    autopostData = data;
  } catch (error) {
    console.error('Error:', error);
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

    const data = await response.json();
    processData(data.match_groups);
  } catch (error) {
    console.error("Error:", error);
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
    
    if (autopostData[0].enabled) {
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
  try {
    // Fetch WebP image using the photoLink
    const webpImageResponse = await fetch(photoLink);
    const webpImageBuffer = await webpImageResponse.arrayBuffer();

    // Convert WebP to JPEG using sharp stream
    const jpegBuffer = await sharp(webpImageBuffer)
      .resize(800)
      .jpeg()
      .toBuffer();

    const oauth = new OAuth.OAuth(
      null,
      null,
      consumerKey,
      consumerSecret,
      "1.0A",
      null,
      "HMAC-SHA1"
    );

    const postParams = {
      type: "photo",
      caption: postText,
      data64: jpegBuffer.toString("base64"),
    };

    oauth.post(
      `https://open.tiktokapis.com/v2/post/publish/content/init/`,
      accessToken,
      accessTokenSecret,
      postParams,
      "",
      (error, data) => {
        if (error) {
          console.error("Error posting to TikTok:", error);
        } else {
          console.log("Post successful:", data);
        }
      }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

// Obtain access token
getAccessToken().then(fetchData);

setInterval(fetchData, 60000);
