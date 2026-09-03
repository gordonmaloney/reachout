export const initialContacts = [
  { id: "1", name: "Sandy Mills", phone: "+44 7700 900101" },
  { id: "2", name: "Mia Benson", phone: "+44 7700 900102" },
  { id: "3", name: "Jake Woods", phone: "+44 7700 900103" },
  { id: "4", name: "Lila Harper", phone: "+44 7700 900104" },
  { id: "5", name: "Gabe Tucker", phone: "+44 7700 900105" },
];

export function isDemoContact(contact) {
  return initialContacts.some(
    (example) =>
      example.id === contact?.id &&
      example.name === contact?.name &&
      example.phone === contact?.phone
  );
}

export const initialTemplates = [
  {
    id: "t1",
    title: "Follow up",
    body: "Hey {FIRSTNAME} - great to chat. Here are the details about that action...",
  },
  {
    id: "t2",
    title: "No answer",
    body: "Hey {FIRSTNAME}! I'm getting in touch from Living Rent. I was just phoning to tell you about this action we've got coming up...",
  },
];

export const mockScriptBullets = [
  "Greet and introduce yourself as a tenant union organizer.",
  "Invite them to the rogue landlord debrief campaign.",
  "Confirm details (Friday, Strathmore Bar back room).",
  "Ask if they need transport or have access requirements.",
  "Thank them and confirm they are saved on the attendee tracker.",
];
