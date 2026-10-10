import { handleContact, type Env } from '../../worker/index.ts'

// Pages discovers this file as /api/contact. Handle every method so unsupported
// requests receive the same JSON 405 response as the standalone Worker.
export function onRequest({ request, env }: {
  request: Request
  env: Pick<Env, 'TELEGRAM_BOT_TOKEN' | 'TELEGRAM_CHAT_ID'>
}): Promise<Response> {
  return handleContact(request, env)
}
