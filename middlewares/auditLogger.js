const { AuditLog } = require('../models');

// Usage: router.delete('/:id', protect, authorize('admin'), auditLog('admin','Deleted product'), controller.fn)
function auditLog(category, action, descFn) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function(body) {
            // Only log on success (2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const description = typeof descFn === 'function'
                    ? descFn(req, body)
                    : action;
                AuditLog.create({
                    user_id: req.user?.id || null,
                    category,
                    action,
                    description,
                    meta: { params: req.params, body: req.body }
                }).catch(err => console.error('Audit log write failed:', err.message));
            }
            return originalJson(body);
        };
        next();
    };
}

module.exports = auditLog;