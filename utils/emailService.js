const transporter = require('../config/email');

exports.sendVerificationEmail = (user, uniqueString) => {
    const mailOptions = {
        from: `"Biogram" <${process.env.AUTH_EMAIL}>`,
        to: user.email,
        subject: 'Verify Your Email',
        html: `<p>Click <a href="${process.env.FRONTEND_URL}/verify/${user._id}/${uniqueString}">here</a> to verify your email</p>`
    };

    return transporter.sendMail(mailOptions);
};