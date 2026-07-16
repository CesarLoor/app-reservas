import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Formato de token invalido' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({ message: 'Error interno del servidor' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = {
            userId: decoded.userId,
            nombre: decoded.nombre,
            email: decoded.email
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalido' });
    }
}
