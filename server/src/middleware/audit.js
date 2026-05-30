import prisma from '../db/prisma.js';

export function auditLog(entity) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (req.user && req.method !== 'GET') {
        const action = req.method === 'POST' ? 'CREATE' : req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE' : req.method === 'DELETE' ? 'DELETE' : req.method.toUpperCase();
        const entityId = req.params.id || req.body?.id || null;
        const details = JSON.stringify({
          action,
          entity: entity,
          entityId,
          user: req.user.username,
          timestamp: new Date().toISOString(),
          body: req.method !== 'GET' ? Object.keys(req.body).join(', ') : null,
        });

        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            entity,
            entityId,
            details,
          },
        }).catch(err => console.error('Audit log error:', err));
      }

      return originalJson(data);
    };

    next();
  };
}
