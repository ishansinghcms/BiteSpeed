const Contact = require("../models/contact");

exports.getIdentity = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
    //extracting all contacts with given email
    const contactsByEmail = await Contact.find({ email: email });

    if (contactsByEmail.length === 0) {
      // No account with this email, but maybe phoneNumber matches
      //extracting all contacts with given phoneNumber
      const contactsByPhone = await Contact.find({ phoneNumber: phoneNumber });

      if (contactsByPhone.length === 0) {
        // No email and phoneNumber matched, creating new primary contact
        const date = Date.now();
        const newPrimaryContact = new Contact({
          email: email,
          phoneNumber: phoneNumber,
          linkPrecedence: "primary",
          createdAt: date,
          updatedAt: date,
        });
        await newPrimaryContact.save();
        return res.status(201).json({
          contact: {
            primaryContactId: newPrimaryContact._id,
            emails: [email],
            phoneNumbers: [phoneNumber],
            secondaryContactIds: [null],
          },
        });
      } else {
        // No account with this email but phone matches
        let primaryContact = contactsByPhone.find(
          (contact) => contact.linkPrecedence === "primary"
        );
        let primaryContactId;
        if (!primaryContact) {
          primaryContactId = contactsByPhone[0].linkedId;
          primaryContact = await Contact.findOne({ _id: primaryContactId });
        } else {
          primaryContactId = primaryContact._id;
        }
        const secondaryContacts = await Contact.find({
          linkedId: primaryContactId,
        });
        const date = Date.now();
        const newSecondaryContact = new Contact({
          email: email, // new email
          phoneNumber: phoneNumber, // old phone
          linkPrecedence: "secondary",
          linkedId: primaryContactId,
          createdAt: date,
          updatedAt: date,
        });
        await newSecondaryContact.save();
        const emails = [
          primaryContact.email,
          ...secondaryContacts.map((contact) => contact.email),
          newSecondaryContact.email,
        ];
        const phoneNumbers = [
          primaryContact.phoneNumber,
          ...secondaryContacts.map((contact) => contact.phoneNumber),
          newSecondaryContact.phoneNumber,
        ];
        const uniqueEmails = [...new Set(emails)];
        const uniquePhoneNumbers = [...new Set(phoneNumbers)];
        const secondaryContactIds = secondaryContacts.map(
          (contact) => contact._id
        );
        return res.status(201).json({
          contact: {
            primaryContactId: primaryContactId,
            emails: uniqueEmails,
            phoneNumbers: uniquePhoneNumbers,
            secondaryContactIds: [
              ...secondaryContactIds,
              newSecondaryContact._id,
            ],
          },
        });
      }
    } else {
      //contacts with same email exist
      //check for phoneNumber
      const primaryContact = contactsByEmail.find(
        (contact) => contact.linkPrecedence === "primary"
      );
      const contactsByPhone = await Contact.find({ phoneNumber: phoneNumber });
      if (contactsByPhone.length === 0) {
        // email match phoneNumber no match
        const date = Date.now();
        let primaryContactId;
        if (!primaryContact) {
          primaryContactId = contactsByEmail[0].linkedId;
        } else {
          primaryContactId = primaryContact._id;
        }
        const newSecondaryContact = new Contact({
          email: email,
          phoneNumber: phoneNumber,
          linkPrecedence: "secondary",
          linkedId: primaryContactId,
          createdAt: date,
          updatedAt: date,
        });
        await newSecondaryContact.save();
        const secondaryContacts = await Contact.find({
          linkedId: primaryContactId,
        });
        const secondaryContactIds = secondaryContacts.map(
          (contact) => contact._id
        );
        const primary = await Contact.findOne({ _id: primaryContactId });
        const emails = [
          primary.email,
          ...secondaryContacts.map((contact) => contact.email),
          newSecondaryContact.email,
        ];
        const uniqueEmails = [...new Set(emails)];
        const phoneNumbers = [
          primary.phoneNumber,
          ...secondaryContacts.map((contact) => contact.phoneNumber),
          newSecondaryContact.phoneNumber,
        ];
        const uniquePhoneNumbers = [...new Set(phoneNumbers)];
        return res.status(201).json({
          contact: {
            primaryContactId: primaryContactId,
            emails: uniqueEmails,
            phoneNumbers: uniquePhoneNumbers,
            secondaryContactIds: secondaryContactIds,
          },
        });
      } else {
        //email and phoneNumber matches
        //check if existing any contact has primary precedence
        let primaryContactId;
        if (!primaryContact) {
          primaryContactId = contactsByEmail[0].linkedId;
        } else {
          primaryContactId = primaryContact._id;
        }
        const primaryInContactsByPhone = contactsByPhone.find(
          (contact) => contact.linkPrecedence === "primary"
        );
        //updating primary account and its secondary accounts linkedId
        if (
          primaryInContactsByPhone &&
          primaryContactId.toString() !==
            primaryInContactsByPhone._id.toString()
        ) {
          await Contact.updateMany(
            { linkedId: primaryInContactsByPhone._id },
            {
              $set: {
                linkPrecedence: "secondary",
                updatedAt: Date.now(),
                linkedId: primaryContactId,
              },
            }
          );
          await Contact.updateOne(
            { _id: primaryInContactsByPhone._id },
            {
              $set: {
                linkPrecedence: "secondary",
                updatedAt: Date.now(),
                linkedId: primaryContactId,
              },
            }
          );
        } else {
          //getting primary account and then updating it and all its secondary accounts
          const primaryIdContactsByPhone = contactsByPhone[0].linkedId;
          if (
            primaryIdContactsByPhone !== null &&
            primaryContactId.toString() !== primaryIdContactsByPhone.toString()
          ) {
            await Contact.updateMany(
              { linkedId: primaryIdContactsByPhone },
              {
                $set: {
                  linkPrecedence: "secondary",
                  updatedAt: Date.now(),
                  linkedId: primaryContactId,
                },
              }
            );
            await Contact.updateOne(
              { _id: primaryIdContactsByPhone },
              {
                $set: {
                  linkPrecedence: "secondary",
                  updatedAt: Date.now(),
                  linkedId: primaryContactId,
                },
              }
            );
          }
        }
        const primary = await Contact.findOne({ _id: primaryContactId });
        const secondaryContacts = await Contact.find({
          linkedId: primaryContactId,
        });
        const emails = [
          primary.email,
          email,
          ...secondaryContacts.map((contact) => contact.email),
        ];
        const secondaryContactIds = secondaryContacts.map(
          (contact) => contact._id
        );
        const phoneNumbers = [
          primary.phoneNumber,
          phoneNumber,
          ...secondaryContacts.map((contact) => contact.phoneNumber),
        ];
        const uniqueEmails = [...new Set(emails)];
        const uniquePhoneNumbers = [...new Set(phoneNumbers)];
        return res.status(200).json({
          contact: {
            primaryContactId: primaryContactId,
            emails: uniqueEmails,
            phoneNumbers: uniquePhoneNumbers,
            secondaryContactIds: secondaryContactIds,
          },
        });
      }
    }
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).send("Internal Server Error");
  }
};
