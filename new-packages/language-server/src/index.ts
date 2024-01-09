import {
  createConnection,
  startTypeScriptServer,
} from '@volar/language-server/node.js';
import { createXStateServerPlugin } from './serverPlugin';

const connection = createConnection();
startTypeScriptServer(connection, createXStateServerPlugin(connection));
