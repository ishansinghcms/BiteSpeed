const Contact = require("../models/contact");

module.exports = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
    if (email === null) {
      if (phoneNumber === null) {
        return res.json({
          message: "Both email and phone number fields cannot be empty.",
        });
      } else {
        const contactsByPhone = await Contact.find({
          phoneNumber: phoneNumber,
        });
        if (contactsByPhone.length === 0) {
          return res.status(404).json({
            message:
              "No account exists with this phone number. In order to create a new account please provide the email too.",
          });
        } else {
          let primaryContact = contactsByPhone.find(
            (contact) => contact.linkPrecedence === "primary"
          );
          let primaryContactId;
          if (!primaryContact) {
            primaryContactId = contactsByPhone[0].linkedId;
          } else {
            primaryContactId = primaryContact._id;
          }
          const secondaryContacts = await Contact.find({
            linkedId: primaryContactId,
          });
          const secondaryContactsId = secondaryContacts.map(
            (contact) => contact._id
          );
          primaryContact = await Contact.findOne({ _id: primaryContactId });
          const emails = [
            primaryContact.email,
            ...secondaryContacts.map((contact) => contact.email),
          ];
          const uniqueEmails = [...new Set(emails)];
          const phoneNumbers = [
            primaryContact.phoneNumber,
            ...secondaryContacts.map((contact) => contact.phoneNumber),
          ];
          const uniquePhoneNumbers = [...new Set(phoneNumbers)];
          return res.json({
            contact: {
              primaryContactId: primaryContactId,
              emails: uniqueEmails,
              phoneNumbers: uniquePhoneNumbers,
              secondaryContactIds: secondaryContactsId,
            },
          });
        }
      }
    } else {
      if (phoneNumber == null) {
        const contactsByEmail = await Contact.find({ email: email });
        if (contactsByEmail.length == 0) {
          return res.status(404).json({
            message:
              "No account exists with this email. In order to create a new account please provide the phone number too.",
          });
        } else {
          let primaryContact = contactsByEmail.find(
            (contact) => contact.linkPrecedence === "primary"
          );
          let primaryContactId;
          if (!primaryContact) {
            primaryContactId = contactsByEmail[0].linkedId;
          } else {
            primaryContactId = primaryContact._id;
          }
          primaryContact = await Contact.findOne({ _id: primaryContactId });
          const secondaryContacts = await Contact.find({
            linkedId: primaryContactId,
          });
          const secondaryContactsId = secondaryContacts.map(
            (contact) => contact._id
          );
          const emails = [
            primaryContact.email,
            email,
            ...secondaryContacts.map((contact) => contact.email),
          ];
          const uniqueEmails = [...new Set(emails)];
          const phoneNumbers = [
            primaryContact.phoneNumber,
            ...secondaryContacts.map((contact) => contact.phoneNumber),
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
      }
    }
    next();
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).send("Internal Server Error");
  }
};
