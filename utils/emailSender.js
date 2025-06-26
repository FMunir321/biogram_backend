const transporter = require('../config/email');

exports.sendVerificationEmail = async (user) => {
    const mailOptions = {
        from: `"Biogram" <${process.env.AUTH_EMAIL}>`,
        to: user.email,
        subject: 'Verify Your Email',
        html: `<p>Click <a href="${process.env.BASE_URL}/verify/${user.id}/...">here</a> to verify</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`Email failed to ${user.email}:`, error);
        return false;
    }
};