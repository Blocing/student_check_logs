const db = require('mysql2/promise');
const path = require('path');
const result = require('dotenv').config({path: path.resolve(__dirname, '../.env')});

const pool = db.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit:5,
    dateStrings: 'date'
});

// const dbTest = async () => {
//     const connection = await pool.getConnection();
//     console.log('연결완료');
//     console.log(connection);
//     const [rows] = await connection.query('select * from test');
//     console.log(rows);
// };
// dbTest();
module.exports = {
    getConn: _ => pool.getConnection()
}