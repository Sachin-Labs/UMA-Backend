const Team = require('../models/Team');
const Organisation = require('../models/Organisation');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../utils/auditLogger');

class TeamService {
    async create(organisationId, data, performedBy) {
        // If officeHours not provided, inherit from Organisation
        if (!data.officeHours || !data.officeHours.startTime || !data.officeHours.endTime) {
            const org = await Organisation.findById(organisationId);
            if (org && org.officeHours) {
                data.officeHours = org.officeHours;
            } else {
                // Fallback default
                data.officeHours = { startTime: '09:00', endTime: '18:00' };
            }
        }

        const team = await Team.create({ ...data, organisationId });

        await createAuditLog({
            organisationId,
            action: 'TEAM_CREATED',
            performedBy,
            entityType: 'Team',
            entityId: team._id,
            metadata: { name: team.name },
        });

        return team;
    }

    async list(organisationId) {
        return Team.find({ organisationId }).sort({ name: 1 });
    }

    async getById(organisationId, teamId) {
        const team = await Team.findOne({ _id: teamId, organisationId });
        if (!team) throw new AppError('Team not found.', 404);
        return team;
    }

    async update(organisationId, teamId, updates, performedBy) {
        const allowed = ['name', 'location', 'radius', 'workMode', 'maxWFHDaysPerMonth', 'officeHours'];
        const filteredUpdates = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
        }

        const team = await Team.findOneAndUpdate(
            { _id: teamId, organisationId },
            filteredUpdates,
            { new: true, runValidators: true }
        );
        if (!team) throw new AppError('Team not found.', 404);

        await createAuditLog({
            organisationId,
            action: 'TEAM_UPDATED',
            performedBy,
            entityType: 'Team',
            entityId: team._id,
            metadata: filteredUpdates,
        });

        return team;
    }

    async delete(organisationId, teamId, performedBy) {
        const team = await Team.findOneAndDelete({ _id: teamId, organisationId });
        if (!team) throw new AppError('Team not found.', 404);

        await createAuditLog({
            organisationId,
            action: 'TEAM_DELETED',
            performedBy,
            entityType: 'Team',
            entityId: teamId,
            metadata: { name: team.name },
        });

        return team;
    }
}

module.exports = new TeamService();
