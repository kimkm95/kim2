const nodemailer = require('nodemailer');
const secret_config = require('../config/secret');
var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: 'kimkm9955@gmail.com',
        pass: '???'
    }
}));

module.exports= transporter;
