
const mongoose = require("mongoose");
const Court = require("../models/Court");
const Staff = require("../models/Staff");
const RecycleBin = require("../models/Recyclebin");



exports.getAllCourts = async (req, res) => {
  try {
    const courts = await Court.find();
    res.json({ success: true, courts });
  } catch (error) {
    console.error("Get all courts error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




exports.createCircuitCourt = async (req, res) => {
  try {
    const { name, location, address, contactInfo, description } = req.body;

    const court = new Court({
      name,
      type: "circuit",
      location,
      address,
      contactInfo,
      description,
    });

    await court.save();
    res.status(201).json({ success: true, message: "Circuit court created", court });
  } catch (error) {
    console.error("Create circuit court error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.getCircuitCourts = async (req, res) => {
  try {
    const courts = await Court.find({ type: "circuit", isActive: true });
    const results = await Promise.all(
      courts.map(async (court) => {
        const staffCount = await Staff.countDocuments({ courtId: court._id });
        return { _id: court._id, name: court.name, staffCount };
      })
    );

    res.json({ success: true, courts: results });
  } catch (error) {
    console.error("Get circuit courts error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.deleteCircuitCourt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const court = await Court.findById(id);
    if (!court || court.type !== "circuit")
      return res.status(404).json({ success: false, message: "Circuit not found" });

    // Get staff + magisterial courts
    const staff = await Staff.find({ courtId: id });
    const magCourts = await Court.find({ circuitCourtId: id });

    // Save into recycle bin - store only the main court data
    await RecycleBin.create({
      entityType: "court",
      entityId: court._id,
      data: court.toObject(), // Store only the court, not nested data
      deletedBy: req.user?.userId,
    });

    // Delete data
    await Staff.deleteMany({ courtId: id });
    for (let mc of magCourts) {
      await Staff.deleteMany({ courtId: mc._id });
      await mc.deleteOne();
    }
    await court.deleteOne();

    res.json({ success: true, message: "Circuit court moved to recycle bin" });
  } catch (error) {
    console.error("Delete circuit court error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.createMagisterialCourt = async (req, res) => {
  try {
    const { name, location, circuitCourtId } = req.body;
    const circuit = await Court.findById(circuitCourtId);

    if (!circuit || circuit.type !== "circuit")
      return res.status(400).json({ success: false, message: "Invalid circuit court" });

    const court = new Court({ name, type: "magisterial", location, circuitCourtId });
    await court.save();

    res.status(201).json({ success: true, message: "Magisterial court created", court });
  } catch (error) {
    console.error("Create magisterial court error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
exports.updateMagisterialCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, circuitCourtId } = req.body;

    const court = await Court.findById(id);
    if (!court || court.type !== "magisterial") {
      return res
        .status(404)
        .json({ success: false, message: "Magisterial court not found" });
    }

    if (circuitCourtId) {
      const circuit = await Court.findById(circuitCourtId);
      if (!circuit || circuit.type !== "circuit") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid circuit court" });
      }
      court.circuitCourtId = circuitCourtId;
    }

    court.name = name || court.name;
    court.location = location || court.location;

    await court.save();
    res.json({ success: true, message: "Court updated", court });
  } catch (error) {
    console.error("Update magisterial court error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.getMagisterialCourts = async (req, res) => {
  try {
    const courts = await Court.find({ type: "magisterial"})
      .populate("circuitCourtId", "name");

    const results = await Promise.all(
      courts.map(async (court) => {
        const staffCount = await Staff.countDocuments({ courtId: court._id });
        return {
          _id: court._id,
          name: court.name,
          circuitCourt: court.circuitCourtId?.name || null,
          circuitCourtId: court.circuitCourtId?._id || null,
          staffCount,
        };
      })
    );

    res.json({ success: true, courts: results });
  } catch (error) {
    console.error("Get magisterial courts error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMagisterialCourtsByCircuit = async (req, res) => {
  try {
    const { circuitId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(circuitId)) {
      return res.status(400).json({ success: false, message: "Invalid circuit ID" });
    }

    const courts = await Court.find({
      type: "magisterial",
      isActive: true,
      circuitCourtId: circuitId,
    }).populate("circuitCourtId", "name");

    const results = await Promise.all(
      courts.map(async (court) => {
        const staffCount = await Staff.countDocuments({ courtId: court._id });
        return {
          _id: court._id,
          name: court.name,
          circuitCourt: court.circuitCourtId?.name || null,
          circuitCourtId: court.circuitCourtId?._id || null,
          staffCount,
        };
      })
    );

    res.json({ success: true, courts: results });
  } catch (error) {
    console.error("Get magisterial courts by circuit error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.getCourtById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const court = await Court.findById(id).populate("circuitCourtId", "name");
    if (!court) {
      return res.status(404).json({ success: false, message: "Court not found" });
    }

    res.json({ success: true, court });
  } catch (error) {
    console.error("Get court by id error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const update = (({ name, location, address, contactInfo, description }) => ({
      name,
      location,
      address,
      contactInfo,
      description,
    }))(req.body);

    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const court = await Court.findByIdAndUpdate(id, update, { new: true }).populate(
      "circuitCourtId",
      "name"
    );

    if (!court) {
      return res.status(404).json({ success: false, message: "Court not found" });
    }

    res.json({ success: true, message: "Court updated", court });
  } catch (error) {
    console.error("Update court error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.deleteMagisterialCourt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const court = await Court.findById(id);
    if (!court || court.type !== "magisterial")
      return res.status(404).json({ success: false, message: "Magisterial not found" });

    await RecycleBin.create({
      entityType: "court",
      entityId: court._id,
      data: court.toObject(), // Store only the court
      deletedBy: req.user?.userId,
    });

    await Staff.deleteMany({ courtId: id });
    await court.deleteOne();

    res.json({ success: true, message: "Magisterial court moved to recycle bin" });
  } catch (error) {
    console.error("Delete magisterial court error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.createDepartment = async (req, res) => {
  try {
    const { name, location } = req.body;
    const department = new Court({ name, type: "department", location });
    await department.save();

    res.status(201).json({ success: true, message: "Department created", department });
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const department = await Court.findByIdAndUpdate(
      id,
      { name, location },
      { new: true }
    );
    if (!department)
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });

    res.json({ success: true, message: "Department updated", department });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
exports.getDepartments = async (req, res) => {
  try {
    const depts = await Court.find({ type: "department", isActive: true });
    const results = await Promise.all(
      depts.map(async (d) => {
        const staffCount = await Staff.countDocuments({ courtId: d._id });
        return { _id: d._id, name: d.name, staffCount };
      })
    );

    res.json({ success: true, departments: results });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Court.findById(id);

    if (!dept || dept.type !== "department")
      return res.status(404).json({ success: false, message: "Department not found" });

    await RecycleBin.create({
      entityType: "court",
      entityId: dept._id,
      data: dept.toObject(), // Store only the department
      deletedBy: req.user?.userId,
    });

    await Staff.deleteMany({ courtId: id });
    await dept.deleteOne();

    res.json({ success: true, message: "Department moved to recycle bin" });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
