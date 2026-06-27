// GET /api/admin/dashboard
exports.getDashboard = (req, res) => {
    res.status(200).json({
        message: `Welcome to the Admin Dashboard, ${req.user.name}. Secure data accessed successfully.`
    });
};