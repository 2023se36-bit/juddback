const mongoose=require("mongoose");

const recycleBinSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ["staff", "court"],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  deletedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RecycleBin", recycleBinSchema);