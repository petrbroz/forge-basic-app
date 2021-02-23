const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}

const GoogleAuthOptions = {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
};

const verifyUser = (accessToken, refreshToken, profile, done) => {
    for (const email of profile.emails) {
        // For now, we consider all users verified as long as their email is verified
        if (email.verified) {
            done(null, profile);
            return;
        }
    }
};  

const serializeUser = (user, done) => {
    done(null, user);
};

const deserializeUser = (user, done) => {
    done(null, user);
};

module.exports = {
    GoogleAuthOptions,
    verifyUser,
    serializeUser,
    deserializeUser
};