import express from 'express';
const app = express();
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import cors from 'cors';

app.use(cookieParser());
app.use(cors());
app.listen(process.env.PORT || 5000);

const CLIENT_KEY = 'awtk9q11ll2kqoe1' // this value can be found in app's developer portal

app.get('/oauth', (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    // the following params need to be in `application/x-www-form-urlencoded` format.
    url += '?client_key=awtk9q11ll2kqoe1';
    url += '&scope=user.info.basic';
    url += '&response_type=code';
    url += '&redirect_uri=https://sportscore.io/';
    url += '&state=' + csrfState;

    res.redirect(url);
})
