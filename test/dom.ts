import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Server handlers are tested with Bun's native Request/Response; happy-dom would replace them.
const { Request, Response, Headers, fetch } = globalThis;
GlobalRegistrator.register({ url: 'http://localhost/' });
Object.assign(globalThis, { Request, Response, Headers, fetch });
