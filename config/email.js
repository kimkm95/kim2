const nodemailer = require('nodemailer');
const secret_config = require('../config/secret');
var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: '',
        pass: ''
    }
}));

module.exports= transporter;
