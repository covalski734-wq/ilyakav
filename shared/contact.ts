export const PROJECT_TYPES = ['site', 'landing', 'webApp', 'desktop', 'redesign', 'bot', 'automation', 'booking', 'other'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]
export const isProjectType = (value: unknown): value is ProjectType =>
  typeof value === 'string' && PROJECT_TYPES.includes(value as ProjectType)
export const LIMITS = { name: 120, contact: 200, brief: 3500 } as const
export const MAX_BODY_BYTES = 32 * 1024
export type ContactField = keyof typeof LIMITS | 'type'
export type FieldError = 'required' | 'too_long' | 'invalid_contact' | 'invalid_type'
export type FieldErrors = Partial<Record<ContactField, FieldError>>
export function validateContact(input: Record<string, unknown>) {
  const value = (key: string) => typeof input[key] === 'string' ? input[key].trim() : ''
  const data = { name: value('name'), contact: value('contact'), brief: value('brief'), type: value('type') }
  const errors: FieldErrors = {}
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    if (!data[key]) errors[key] = 'required'
    else if (data[key].length > LIMITS[key]) errors[key] = 'too_long'
  }
  if (!errors.contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact) && !/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(data.contact)) errors.contact = 'invalid_contact'
  if (!isProjectType(data.type)) errors.type = 'invalid_type'
  return { data, errors, valid: Object.keys(errors).length === 0 }
}
