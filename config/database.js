const mysql = require('mysql2/promise');
const {logger} = require('./winston');

// TODO: 본인의 DB 계정 입력
const pool = mysql.createPool({
    host: 'softsquareddb.c30jwxmcu9gi.ap-northeast-2.rds.amazonaws.com',
    user: 'master',
    port: '3306',
    password: '???',
    database: 'DiaryDB'
});

module.exports = {
    pool: pool
};
