const mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "minhascontas"
});

con.connect(function (err) {
    if (err) reject(err);
});
module.exports = con;