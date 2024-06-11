const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new Schema({
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  linkedId: {
    type: Schema.Types.ObjectId,
    ref: "contacts",
    default: null,
  },
  linkPrecedence: {
    type: String,
    enum: ["primary", "secondary"],
    required: true,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Contact", contactSchema);
