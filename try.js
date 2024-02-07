import http from 'http';
import querystring from 'querystring';
import axios from 'axios';
import { URL } from 'url';

const server = http.createServer((req, res) => {
    const { method, url } = req;
    const parsedUrl = new URL(`http://localhost:4000${url}`);

    if (method === 'GET' && parsedUrl.pathname === '/oauth') {
        const csrfState = Math.random().toString(36).substring(2);
        res.setHeader('Set-Cookie', [`csrfState=${csrfState}; Max-Age=60000`]);
        const params = {
            client_key: 'awtk9q11ll2kqoe1',
            scope: 'user.info.basic,user.info.profile,user.info.stats,video.list',
            response_type: 'code',
            redirect_uri: 'https://sportscore.io/',
            state: csrfState
        };
        const url = `https://www.tiktok.com/v2/auth/authorize/?${querystring.stringify(params)}`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url }));
    } else if (method === 'POST' && parsedUrl.pathname === '/tiktokaccesstoken') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { code } = JSON.parse(body);
                const decode = decodeURI(code);
                const tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
                const params = {
                    client_key: 'awtk9q11ll2kqoe1',
                    client_secret: 'Frrdb0ZJUjCh7hXtEc9VinH1rr6ysnjk',
                    code: decode,
                    grant_type: 'authorization_code',
                    redirect_uri: 'https://sportscore.io/'
                };
                const response = await axios.post(tokenEndpoint, querystring.stringify(params), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cache-Control': 'no-cache'
                    }
                });
                if (response.data.access_token) {
                    const allvideosdata = await axios.post('https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_link', {
                        max_count: 20
                    }, {
                        headers: {
                            Authorization: `Bearer ${response.data.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(allvideosdata.data.data.videos); // Lists all videos of user along with other details
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(allvideosdata.data.data.videos));
                }
            } catch (error) {
                console.error('Error during callback:', error.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('An error occurred during the login process.');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
