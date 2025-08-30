// const mongoose = require("mongoose");

// const staffSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     position: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     courtType: {
//       type: String,
//       required: true,
//       enum: ["circuit", "magisterial", "department"],
//     },
//     courtId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Court",
//       required: true,
//     },
//     phone: {
//       type: String,
//       trim: true,
//       maxlength: 20,
//     },
//     education: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     area: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     employmentStatus: {
//       type: String,
//       enum: ["active", "retired", "dismissed", "on_leave"],
//       default: "active",
//       required: true,
//     },
//     hireDate: {
//       type: Date,
//       default: Date.now,
//     },
//     retirementDate: Date,
//     dismissalDate: Date,
//     leaveStartDate: Date,
//     leaveEndDate: Date,
//   },
//   { timestamps: true }
// );

// /**
//  * Indexes (for performance on frequent queries)
//  */
// staffSchema.index({ employmentStatus: 1 });
// staffSchema.index({ courtId: 1, courtType: 1 });
// staffSchema.index({ name: 1 });

// /**
//  * Instance method to update employment status
//  */
// staffSchema.methods.updateEmploymentStatus = async function (
//   newStatus,
//   dates = {}
// ) {
//   this.employmentStatus = newStatus;

//   // Reset all status-specific fields
//   this.retirementDate = undefined;
//   this.dismissalDate = undefined;
//   this.leaveStartDate = undefined;
//   this.leaveEndDate = undefined;

//   switch (newStatus) {
//     case "retired":
//       this.retirementDate = dates.retirementDate || new Date();
//       break;
//     case "dismissed":
//       this.dismissalDate = dates.dismissalDate || new Date();
//       break;
//     case "on_leave":
//       this.leaveStartDate = dates.leaveStartDate || new Date();
//       if (dates.leaveEndDate) this.leaveEndDate = dates.leaveEndDate;
//       break;
//   }

//   return this.save();
// };

// /**
//  * Pre-save middleware to enforce valid status-date combinations
//  */
// staffSchema.pre("save", function (next) {
//   if (this.employmentStatus !== "retired") this.retirementDate = undefined;
//   if (this.employmentStatus !== "dismissed") this.dismissalDate = undefined;
//   if (this.employmentStatus !== "on_leave") {
//     this.leaveStartDate = undefined;
//     this.leaveEndDate = undefined;
//   }
//   next();
// });

// module.exports = mongoose.model("Staff", staffSchema);
const mongoose = require("mongoose");

const { Schema } = mongoose;

const staffSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    position: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    courtType: {
      type: String,
      required: true,
      enum: ["circuit", "magisterial", "department"],
      index: true, // small optimization
    },
    courtId: {
      type: Schema.Types.ObjectId,
      ref: "Court",
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    education: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    employmentStatus: {
      type: String,
      enum: ["active", "retired", "dismissed", "on_leave"],
      default: "active",
      required: true,
      index: true,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    retirementDate: Date,
    dismissalDate: Date,
    leaveStartDate: Date,
    leaveEndDate: Date,
  },
  { timestamps: true }
);

/**
 * Compound indexes for better query performance
 */
staffSchema.index({ courtId: 1, employmentStatus: 1 });
staffSchema.index({ name: 1 });

/**
 * Instance method: safely update employment status & relevant dates
 */
staffSchema.methods.updateEmploymentStatus = async function (
  newStatus,
  dates = {}
) {
  this.employmentStatus = newStatus;

  // Clear irrelevant dates
  this.retirementDate = undefined;
  this.dismissalDate = undefined;
  this.leaveStartDate = undefined;
  this.leaveEndDate = undefined;

  switch (newStatus) {
    case "retired":
      this.retirementDate = dates.retirementDate || new Date();
      break;
    case "dismissed":
      this.dismissalDate = dates.dismissalDate || new Date();
      break;
    case "on_leave":
      this.leaveStartDate = dates.leaveStartDate || new Date();
      if (dates.leaveEndDate) this.leaveEndDate = dates.leaveEndDate;
      break;
  }

  return this.save();
};

/**
 * Pre-save middleware:
 * ensures only valid date fields are set based on employmentStatus
 */
staffSchema.pre("save", function (next) {
  if (this.employmentStatus !== "retired") this.retirementDate = undefined;
  if (this.employmentStatus !== "dismissed") this.dismissalDate = undefined;
  if (this.employmentStatus !== "on_leave") {
    this.leaveStartDate = undefined;
    this.leaveEndDate = undefined;
  }
  next();
});

/**
 * Static method: Get aggregated statistics
 * Usage: const stats = await Staff.getStatistics();
 */
staffSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    { $group: { _id: "$employmentStatus", count: { $sum: 1 } } },
  ]);

  const formatted = {
    total: 0,
    active: 0,
    retired: 0,
    dismissed: 0,
    on_leave: 0,
  };

  stats.forEach((s) => {
    if (s._id && formatted.hasOwnProperty(s._id)) {
      formatted[s._id] = s.count;
      formatted.total += s.count;
    }
  });

  return formatted;
};

module.exports = mongoose.model("Staff", staffSchema);
