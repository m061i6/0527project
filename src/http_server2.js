const http = require('http');
const fs = require('fs');
const server = http.createServer((req, res) => {
    fs.writeFile(__dirname + '/header01.json', JSON.stringify(req.headers), error => {
        fs.readFile(__dirname + req.url, (error, data) => {
            res.end(data);
        })
    });
});
server.listen(3000);