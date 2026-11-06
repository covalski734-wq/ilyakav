import { applyHtmlSecurity } from '../shared/htmlSecurity.ts'

// Applies to Pages HTML, including static routes; API and asset responses pass through.
export async function onRequest(context: { next(): Promise<Response> }): Promise<Response> {
  return applyHtmlSecurity(await context.next())
}
