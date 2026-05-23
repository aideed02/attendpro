const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id }, include: { company: true } });
    if (!admin) return res.status(401).json({ error: 'Invalid token' });
    req.admin = admin;
    req.companyId = admin.companyId;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
};

module.exports = { authenticate };
