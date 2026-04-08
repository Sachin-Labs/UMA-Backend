const organisationService = require('../services/organisationService');

const getOrganisation = async (req, res, next) => {
    try {
        const org = await organisationService.getOrganisation(req.user.organisationId);
        res.json({ success: true, data: org });
    } catch (error) {
        next(error);
    }
};

const updateOrganisation = async (req, res, next) => {
    try {
        const org = await organisationService.updateOrganisation(req.user.organisationId, req.body);
        res.json({ success: true, data: org });
    } catch (error) {
        next(error);
    }
};

module.exports = { getOrganisation, updateOrganisation };
