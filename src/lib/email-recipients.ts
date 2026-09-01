export interface ParsedRecipient { name?: string; email: string; company?: string }

function csvFields(line: string) {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { fields.push(value.trim()); value = ""; }
    else value += char;
  }
  fields.push(value.trim());
  return fields;
}

/** Accepts one recipient per line: "Name <email@example.com>, Company" or a bare email. */
export function parseRecipients(raw: string): ParsedRecipient[] {
  const recipients = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const fields = csvFields(line);
      const emailFieldIndex = fields.findIndex((field) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(field));
      if (emailFieldIndex >= 0) {
        return {
          name: fields[emailFieldIndex - 1] || undefined,
          email: fields[emailFieldIndex].toLowerCase(),
          company: fields[emailFieldIndex + 1] || undefined,
        };
      }
      const [beforeComma, ...rest] = fields;
      const company = rest.join(",").trim() || undefined;
      const bracketMatch = beforeComma.match(/^(.*)<([^<>]+)>$/);
      const name = bracketMatch?.[1].trim() || undefined;
      const email = (bracketMatch?.[2] || beforeComma).trim().toLowerCase();
      return { name, email, company };
    })
    .filter((recipient) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email));

  return [...new Map(recipients.map((recipient) => [recipient.email, recipient])).values()];
}
