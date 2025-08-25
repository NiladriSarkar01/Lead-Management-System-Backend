import { json } from "express";
import Lead from "../models/lead.model.js";

// Allowed enum values
const VALID_SOURCES = ["website", "facebook_ads", "google_ads", "referral", "events", "other"];
const VALID_STATUSES = ["new", "contacted", "qualified", "lost", "won"];


export const createLead = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      phone,
      company,
      city,
      state,
      source,
      status,
      score,
      leadValue,
      lastActivityAt,
      isQualified,
    } = req.body;
    console.log(source);
    
    
    const userId=req.user._id;

    // Basic required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and email are required.",
      });
    }

    if(!source) source="other";
    if(!status) status="new";
    if(!score) score=0;
    if(!leadValue) leadValue=0;
    if(!lastActivityAt) lastActivityAt=new Date();
    if(!isQualified) isQualified=false;

    console.log(source, status);
    

    // Validate enums
    if (source && !VALID_SOURCES.includes(source)) {
      return res.status(400).json({ success: false, message: "Invalid source value." });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    // Email validation (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }


    // Check duplicate email for same user
    const existingLead = await Lead.findOne({ email:email, user_id: userId });
    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: "Lead with this email already exists.",
      });
    }
    const lead = {
      user_id:req.user._id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      company: company,
      city: city,
      state: state,
      source: source,
      status: status,
      score: score,
      lead_value: leadValue,
      last_activity_at: lastActivityAt,
      is_qualified: isQualified,
    }
    console.log(lead);
    

    // Create new lead with defaults
    const newLead = new Lead(lead);

    await newLead.save();

    return res.status(201).json({
      success: true,
      message: "New lead created successfully.",
      data: newLead,
    });
  } catch (error) {
    console.error("Create Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const getLeads = async (req, res) => {
  try {
    // Extract query params with defaults
    const { data } = req.query;
    const obj = JSON.parse(data);
    
    const userId=req.user._id;

    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt", // fallback
      order = "desc",
      status,
      source,
      created_at,
      last_activity_at,
      is_qualified,
      score,
      lead_value,
      search,}=obj;
    
      console.log(obj);
      

    const query = {};

    query.user_id=userId;

    // Filtering
    if (status) query.status = status;
    if (source) query.source = source;
    if(is_qualified) {
      if(is_qualified === 'true') query.is_qualified = true;
      if(is_qualified === 'false') query.is_qualified = false;
    }

    if (score) {
      query.score = {
        $gte: Number(score.min),
        $lte: Number(score.max)
      };
    }


    if (lead_value ) {
      query.lead_value = { 
        $gte: Number(lead_value.min),
        $lte: Number(lead_value.max)
      };
    }

    if (created_at && created_at.startDate && created_at.endDate) {
      const start = new Date(created_at.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(created_at.endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (last_activity_at && last_activity_at.startDate && last_activity_at.endDate) {
      const start = new Date(last_activity_at.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(last_activity_at.endDate);
      end.setHours(23, 59, 59, 999);
      query.last_activity_at = {
        $gte: start,
        $lte: end,
      };
    }

    // Search filter
    if (search) {
      query.$or = [
        { first_name: new RegExp(search, "i") },
        { last_name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
        { company: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
        { state: new RegExp(search, "i") },
      ];
    }

    // Sorting
    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [leads, total] = await Promise.all([
      Lead.find(query).sort(sortOptions).skip(skip).limit(Number(limit)),
      Lead.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Leads fetched successfully",
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: leads,
    });
  } catch (error) {
    console.error("Get Leads Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const getLead = async (req, res) => {
  try {
    const { id: leadId } = req.params;

    // Validate ObjectId format
    if (!leadId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Lead ID format",
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead fetched successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Get Lead Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const updateLead = async (req, res) => {
  try {
    const { id: leadId } = req.params;
    const newData = req.body;

    console.log(newData);
    
    // Validate ObjectId format
    if (!leadId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Lead ID format",
      });
    }

    // Check if lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (newData.source && !VALID_SOURCES.includes(newData.source)) {
      return res.status(400).json({
        success: false,
        message: `Invalid source. Allowed values: ${validSources.join(", ")}`,
      });
    }

    if (newData.status && !VALID_STATUSES.includes(newData.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    // Update safely (only allow known fields)
    const allowedFields = [
      "first_name",
      "last_name",
      "phone",
      "company",
      "city",
      "state",
      "source",
      "status",
      "score",
      "lead_value",
      "last_activity_at",
    ];

    const updateFields = {};
    for (const key of allowedFields) {
      if (newData[key] !== undefined) {
        updateFields[key] = newData[key];
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { $set: updateFields },
      { new: true, runValidators: true } // return updated doc + enforce schema rules
    );

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Update Lead Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const deleteLead = async (req, res) => {
  try {
    const { id: leadId } = req.params;

    // Validate MongoDB ObjectId
    if (!leadId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID format",
      });
    }

    // Try to find and delete
    const response = await Lead.findByIdAndDelete(leadId);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      data: response, // return deleted lead object if frontend wants it
    });
  } catch (error) {
    console.error("Delete Lead Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
