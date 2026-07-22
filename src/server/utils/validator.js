export function requiredFields(payload, fields) {
  return fields.filter((field) => !payload?.[field]);
}
