const Contact = require("../models/contact");

module.exports = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;

    const existingContact = await Contact.findOne({
      email: email,
      phoneNumber: phoneNumber,
    });
    if (existingContact) {
      let primaryContactId;
      if (existingContact.linkPrecedence === "primary") {
        primaryContactId = existingContact._id;
      } else {
        primaryContactId = existingContact.linkedId;
      }
      const secondaryContacts = await Contact.find({
        linkedId: primaryContactId,
      });
      const secondaryContactsId = secondaryContacts.map(
        (contact) => contact._id
      );
      const primaryContact = await Contact.findOne({ _id: primaryContactId });
      const emails = [
        primaryContact.email,
        ...secondaryContacts.map((contact) => contact.email),
        email,
      ];
      const uniqueEmails = [...new Set(emails)];
      const phoneNumbers = [
        primaryContact.phoneNumber,
        ...secondaryContacts.map((contact) => contact.phoneNumber),
        phoneNumber,
      ];
      const uniquePhoneNumbers = [...new Set(phoneNumbers)];
      return res.status(200).json({
        contact: {
          primaryContactId: primaryContactId,
          emails: uniqueEmails,
          phoneNumbers: uniquePhoneNumbers,
          secondaryContactIds: secondaryContactsId,
        },
      });
    }
    next();
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).send("Internal Server Error");
  }
};
