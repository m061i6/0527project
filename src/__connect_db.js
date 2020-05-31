const mysql = require('mysql');
const bluebird = require('bluebird');
const db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '!M061i6',
    database : 'aien07'
});
db.on('error',(error)=>{
    console.log('error:',error);
});

db.connect();
bluebird.promisifyAll(db); //bluebird處理
module.exports = db;
console.log('mysql started!');