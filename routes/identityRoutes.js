const express = require("express");
const router = express.Router();
const nullInputCheck = require("../middlewares/nullInput");
const { getIdentity } = require("../controllers/identityController");
const existingContactCheck = require("../middlewares/existingContact");

router.post("/", nullInputCheck, existingContactCheck, getIdentity);

module.exports = router;
