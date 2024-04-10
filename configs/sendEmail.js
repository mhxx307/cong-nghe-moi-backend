const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'secondchancemarketvn@gmail.com', // generated ethereal user
        pass: 'oiwnlzuitfrtukut', // generated ethereal password
    },
    // tls: {
    //     rejectUnauthorized: false, // avoid NodeJs self signed certificate error
    // },
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: 'xxx',
            to: to,
            subject: subject,
            text: html,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
    }
}

module.exports = sendEmail;