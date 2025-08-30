const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: String, // Store base64 encoded image
    required: true
  },
  mimeType: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Static method to get setting by key
settingSchema.statics.getSetting = async function(key) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

// Static method to set setting
settingSchema.statics.setSetting = async function(key, value, mimeType) {
  return await this.findOneAndUpdate(
    { key },
    { key, value, mimeType },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Setting', settingSchema);