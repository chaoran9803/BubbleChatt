const jwt = require('jsonwebtoken');

function signToken(user) {
    return jwt.sign({ sub: user._id.toString(), username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
}

function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

// Express middleware: requires "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }
    try {
        const payload = verifyToken(token);
        req.userId = payload.sub;
        req.username = payload.username;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { signToken, verifyToken, requireAuth };
