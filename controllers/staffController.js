//staff controller
const Staff = require("../models/Staff");
const Court = require("../models/Court");
const RecycleBin = require("../models/Recyclebin");
const mongoose = require("mongoose");

// --- Get all staff ---
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find({}).populate("courtId", "name type");
    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get all staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// --- Statistics ---
exports.getStaffStatistics = async (req, res) => {
  try {
    const stats = await Staff.aggregate([
      {
        $group: {
          _id: "$employmentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const formatted = {
      total: 0,
      active: 0,
      retired: 0,
      dismissed: 0,
      on_leave: 0,
    };

    stats.forEach((s) => {
      formatted[s._id] = s.count;
      formatted.total += s.count;
    });

    res.json({ success: true, statistics: formatted });
  } catch (error) {
    console.error("Get staff stats error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



// --- Filter by status ---
exports.getStaffByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!["active", "retired", "dismissed", "on_leave"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const staff = await Staff.find({ employmentStatus: status })
      .populate("courtId", "name type")
      .sort({ name: 1 });

    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get staff by status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// --- Get all staff (active only with filters) ---
// exports.getActiveStaff = async (req, res) => {
//    try {
//     const { courtId, courtType } = req.query;
//     let filter = { employmentStatus: "active" };

//     if (courtId && courtId !== "undefined") filter.courtId = courtId;
//     if (courtType && courtType !== "undefined") filter.courtType = courtType;

//     const staff = await Staff.find(filter).populate("courtId", "name type");
//     res.json({ success: true, staff });
//   } catch (error) {
//     console.error("Get active staff error:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
exports.getActiveStaff = async (req, res) => {
  try {
    const { courtId, courtType, search } = req.query;
    let filter = { employmentStatus: "active" };

    if (courtId && courtId !== "undefined") filter.courtId = courtId;
    if (courtType && courtType !== "undefined") filter.courtType = courtType;

    // Add search filter
    if (search && search.trim() !== "") {
      const regex = new RegExp(search, "i"); 
      filter.$or = [
        { name: regex },
        { position: regex },
      ];
    }

    const staff = await Staff.find(filter).populate("courtId", "name type");
    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get active staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// --- Get staff by court (circuit/magisterial/department) ---
exports.getStaffByCourt = async (req, res) => {
  try {
    const { courtId } = req.params;
    const staff = await Staff.find({ courtId }).populate("courtId", "name type");
    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get staff by court error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// --- Get single staff ---
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate("courtId", "name type");
    if (!staff) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get staff by id error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// --- Create staff ---
exports.createStaff = async (req, res) => {
  try {
    const staff = new Staff(req.body);
    await staff.save();
    res.status(201).json({ success: true, staff });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- Update staff ---
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, staff });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};


exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid staff ID" });

    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ success: false, message: "Not found" });

    await RecycleBin.create({ 
      entityType: "staff", 
      entityId: staff._id, 
      data: staff.toObject(),
      deletedBy: req.user?.userId,
    });
    await staff.deleteOne();
    res.json({ success: true, message: "Moved to recycle bin" });
  } catch (err) {
    console.error("Delete staff error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getRecycleBin = async (req, res) => {
  try {
    const items = await RecycleBin.find()
      .populate("deletedBy", "name email")
      .sort({ deletedAt: -1 });
    res.json({ success: true, items });
  } catch (error) {
    console.error("Get recycle bin error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.restoreFromRecycleBin = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await RecycleBin.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });

    if (item.entityType === "staff") {
      await Staff.create(item.data);
    } else if (item.entityType === "court") {
      await Court.create(item.data);
    }

    await item.deleteOne();
    res.json({ success: true, message: "Restored successfully" });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.permanentlyDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await RecycleBin.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });

    await item.deleteOne();
    res.json({ success: true, message: "Permanently deleted" });
  } catch (error) {
    console.error("Permanent delete error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
exports.getRetiredStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ employmentStatus: "retired" });
    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get retired staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// staffController.js
exports.getDismissedStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ employmentStatus: "dismissed" }).populate("courtId", "name type");
    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get dismissed staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// staffController.js
exports.getOnLeaveStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ employmentStatus: "on_leave" }).populate("courtId", "name type");
    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get on leave staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};