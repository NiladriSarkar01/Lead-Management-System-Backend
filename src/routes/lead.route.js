import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createLead, deleteLead, getLead, getLeads, updateLead } from '../controllers/lead.controller.js';

const leadRoutes = express.Router();


leadRoutes.post('/leads', protectRoute, createLead); //Create Lead

leadRoutes.get('/leads', protectRoute, getLeads); //Get Leads

leadRoutes.get('/leads/:id', protectRoute, getLead); //Get Lead

leadRoutes.put('/leads/:id', protectRoute, updateLead); //Update Lead

leadRoutes.delete('/leads/:id', protectRoute, deleteLead); //Delete Lead


export default leadRoutes;