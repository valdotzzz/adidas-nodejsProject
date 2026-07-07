const { User, Address, AuditLog } = require('../../models');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching users.', error: error.message });
    }
};

exports.getUserAddresses = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const addresses = await Address.findAll({
            where: { user_id: req.params.id },
            order: [['is_default', 'DESC'], ['createdAt', 'DESC']]
        });
        return res.status(200).json(addresses);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching user addresses.', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['customer', 'staff', 'admin'].includes(role)) {
            return res.status(422).json({ message: 'Invalid role value.' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (user.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ message: 'You cannot change your own role away from admin.' });
        }

        const previousRole = user.role;
        user.role = role;
        await user.save();

        await AuditLog.create({
            category:    req.user.role,
            action:      'USER_ROLE_UPDATE',
            description: `User #${user.id} (${user.email}) role changed: ${previousRole} → ${role}.`,
            meta: {
                target_user: { id: user.id, name: user.name, email: user.email },
                previous_role: previousRole,
                new_role:      role
            }
        });

        return res.status(200).json({ message: 'User role updated successfully.', user });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating user role.', error: error.message });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot deactivate your own account.' });
        }

        const previousStatus = user.status;
        user.status = user.status === 'active' ? 'deactivated' : 'active';
        await user.save();

        await AuditLog.create({
            category:    req.user.role,
            action:      'USER_STATUS_TOGGLE',
            description: `User #${user.id} (${user.email}) status changed: ${previousStatus} → ${user.status}.`,
            meta: {
                target_user:     { id: user.id, name: user.name, email: user.email },
                previous_status: previousStatus,
                new_status:      user.status
            }
        });

        return res.status(200).json({
            message: `User ${user.status === 'active' ? 'reactivated' : 'deactivated'} successfully.`,
            user
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating user status.', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete your own account.' });
        }

        const snapshot = { id: user.id, name: user.name, email: user.email, role: user.role };

        await user.destroy();

        await AuditLog.create({
            category:    req.user.role,
            action:      'USER_DELETE',
            description: `Deleted User #${snapshot.id} — ${snapshot.name} (${snapshot.email}).`,
            meta:        snapshot
        });

        return res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting user.', error: error.message });
    }
};