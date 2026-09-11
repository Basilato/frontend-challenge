/**
 * Must be imported FIRST in the entrypoint, before `socket.io-client`.
 * engine.io-client captures the `WebSocket` global at module-eval time, so the
 * mock class has to be in place before that import is evaluated.
 */
import { startSocketMock } from './socket'

if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
  startSocketMock()
}
