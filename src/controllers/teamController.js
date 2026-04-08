const teamService = require('../services/teamService');
const User = require('../models/User');
const Team = require('../models/Team');
const AppError = require('../utils/AppError');

const create = async (req, res, next) => {
    try {
        const team = await teamService.create(req.user.organisationId, req.body, req.user.userId);
        res.status(201).json({ success: true, data: team });
    } catch (error) {
        next(error);
    }
};

const list = async (req, res, next) => {
    try {
        const teams = await teamService.list(req.user.organisationId);
        res.json({ success: true, data: teams });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const team = await teamService.getById(req.user.organisationId, req.params.id);
        res.json({ success: true, data: team });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const team = await teamService.update(req.user.organisationId, req.params.id, req.body, req.user.userId);
        res.json({ success: true, data: team });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await teamService.delete(req.user.organisationId, req.params.id, req.user.userId);
        res.json({ success: true, message: 'Team deleted.' });
    } catch (error) {
        next(error);
    }
};

const getMyTeam = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !user.teamId) {
            throw new AppError('You are not assigned to any team.', 404);
        }
        const team = await Team.findById(user.teamId);
        if (!team) {
            throw new AppError('Team not found.', 404);
        }
        res.json({ success: true, data: team });
    } catch (error) {
        next(error);
    }
};

module.exports = { create, list, getById, update, remove, getMyTeam };
