let url = 'https://www.tiktok.com/v2/auth/authorize/';

// the following params need to be in `application/x-www-form-urlencoded` format.
url += '?client_key=awtk9q11ll2kqoe1';
url += '&scope=user.info.basic';
url += '&response_type=code';
url += '&redirect_uri=https://sportscore.io/';
url += '&state=' + (new Date().getTime);

console.log(url);