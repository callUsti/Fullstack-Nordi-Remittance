
> nordi-remittance-backend@1.0.0 dev
> nodemon --watch . --ext ts --exec tsx index.ts

[nodemon] 3.1.11
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts
[nodemon] starting `tsx index.ts`
[dotenv@17.2.3] injecting env (65) from .env -- tip: ⚙️  override existing env vars with { override: true }
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔄 add secrets lifecycle management: https://dotenvx.com/ops
2026-11-20 09:04:29:429 warn: [Sentry] Node CPU profiler native addon not available on current Node runtime — continuing with standard tracing
2026-11-20 09:04:30:430 info: [Sentry] Sentry initialized (env: development)
(node:21404) [MONGOOSE] Warning: Duplicate schema index on {"clerkUserId":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
(Use `node --trace-warnings ...` to show where the warning was created)
Email server is ready to send messages
✅ MongoDB connected successfully [pool: 10, autoIndex: true]
2026-11-20 09:04:32:432 info: [ELK] ELASTICSEARCH_URL not set — ELK transport disabled. JSON logs are still written to logs/all.log for Filebeat.

🌱 Running database seeders...

✅ Super admin already exists: unawarexi@gmail.com
✅ System settings initialized
📜 Starting Legal Documents Seeding...
ℹ️  Legal document [terms] is up to date (version: 1.0). Skipping.
ℹ️  Legal document [privacy] is up to date (version: 1.0). Skipping.
✅ Legal Documents Seeding completed.

✅ All seeders completed!

2026-11-20 09:04:45:445 info: [WebSocket] ✅ Server initialized and listening for connections
2026-11-20 09:04:46:446 info: [Redis] ✅ Connected to Redis Cloud
2026-11-20 09:04:46:446 info: [Redis] ✅ Redis Cloud connection established
2026-11-20 09:04:46:446 info: [Startup] Kafka disabled — events handled by no-op adapter (BullMQ + Redis remain active)
2026-11-20 09:04:46:446 info: [BullMQ] ✓ BullMQ queues initialized {"queues":["EMAIL","NOTIFICATION","TRANSACTION","KYC","FRAUD","AUDIT","CLEANUP","DOCUMENT"]}
2026-11-20 09:04:46:446 info: [BullMQ] Worker registered: nordi-email
2026-11-20 09:04:46:446 info: [BullMQ] Worker registered: nordi-notification
2026-11-20 09:04:46:446 info: [BullMQ] Worker registered: nordi-transaction
2026-11-20 09:04:46:446 info: [BullMQ] Worker registered: nordi-kyc
2026-11-20 09:04:46:446 info: [BullMQ] Worker registered: nordi-fraud
2026-11-20 09:04:46:446 info: [BullMQ] Worker registered: nordi-document
2026-11-20 09:04:46:446 info: [BullMQ] Worker registered: nordi-cleanup
2026-11-20 09:04:46:446 info: [Workers] ✓ All Nordi workers started
[dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
2026-11-20 09:04:49:449 debug: [ModuleRegistry] Module registered: Auth → /api/v1/auth
2026-11-20 09:04:49:449 debug: [ModuleRegistry] Module registered: Users → /api/v1/users
2026-11-20 09:04:49:449 debug: [ModuleRegistry] Module registered: KYC → /api/v1/kyc
2026-11-20 09:04:49:449 debug: [ModuleRegistry] Module registered: Accounts → /api/v1/accounts
2026-11-20 09:04:49:449 debug: [ModuleRegistry] Module registered: Transactions → /api/v1/transactions
2026-11-20 09:04:49:449 debug: [ModuleRegistry] Module registered: Secure Transfer → /api/v1/transactions/secure-transfer
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Cards → /api/v1/cards
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Loans → /api/v1/loans
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Investments → /api/v1/investments
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Admin → /api/v1/admin
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Admin Operations → /api/v1/admin/operations
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Statistics → /api/v1/statistics
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Fraud Detection → /api/v1/fraud
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Security → /api/v1/security
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Notifications → /api/v1/notifications
2026-11-20 09:04:50:450 debug: [ModuleRegistry] Module registered: Attachments → /api/v1/attachments
2026-11-20 09:04:51:451 debug: [ModuleRegistry] Module registered: Legal → /api/v1/legal
2026-11-20 09:04:51:451 debug: [ModuleRegistry] Module registered: Integrations → /api/v1/integrations
2026-11-20 09:04:56:456 debug: [ModuleRegistry] Module registered: AI Agent → /api/v1/ai
2026-11-20 09:04:56:456 debug: [ModuleRegistry] Module registered: Permissions → /api/v1/permissions
2026-11-20 09:04:56:456 info: [ModuleRegistry] 20/20 modules registered
[Sentry] express is not instrumented. Please make sure to initialize Sentry in a separate file that you `--import` when running node, see: https://docs.sentry.io/platforms/javascript/guides/express/install/esm/.
(node:21404) [MONGOOSE] Warning: Duplicate schema index on {"expiresAt":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
{"date":"Fri Nov 20 2026 09:04:56 GMT+0100 (West Africa Time)","error":{"address":"::","code":"EADDRINUSE","errno":-4091,"port":3000,"syscall":"listen"},"exception":true,"level":"error","message":"uncaughtException: listen EADDRINUSE: address already in use :::3000\nError: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:2390:16)\n    at listenInCluster (node:net:2499:12)\n    at Server.listen (node:net:2624:7)\n    at startServer (C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Backend-Nordi-remittance\\index.ts:157:10)\n    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)","os":{"loadavg":[0,0,0],"uptime":250936.296},"process":{"argv":["C:\\Program Files\\nodejs\\node.exe","C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Backend-Nordi-remittance\\index.ts"],"cwd":"C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Backend-Nordi-remittance","execPath":"C:\\Program Files\\nodejs\\node.exe","gid":null,"memoryUsage":{"arrayBuffers":26318610,"external":31277178,"heapTotal":175267840,"heapUsed":130135936,"rss":347041792},"pid":21404,"uid":null,"version":"v26.13.0"},"stack":"Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:2390:16)\n    at listenInCluster (node:net:2499:12)\n    at Server.listen (node:net:2624:7)\n    at startServer (C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Backend-Nordi-remittance\\index.ts:157:10)\n    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)","trace":[{"column":16,"file":"node:net","function":"Server.setupListenHandle [as _listen2]","line":2390,"method":"setupListenHandle [as _listen2]","native":false},{"column":12,"file":"node:net","function":"listenInCluster","line":2499,"method":null,"native":false},{"column":7,"file":"node:net","function":"Server.listen","line":2624,"method":"listen","native":false},{"column":10,"file":"C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Backend-Nordi-remittance\\index.ts","function":"startServer","line":157,"method":null,"native":false},{"column":5,"file":"node:internal/process/task_queues","function":"process.processTicksAndRejections","line":104,"method":"processTicksAndRejections","native":false}]}
2026-11-20 09:04:56:456 error: FATAL uncaught exception — shutting down
2026-11-20 09:04:56:456 info: uncaughtException received — starting graceful shutdown…
2026-11-20 09:04:56:456 info: HTTP server closed
2026-11-20 09:04:56:456 info: [WebSocket] Server closed
2026-11-20 09:04:56:456 info: WebSocket disconnected
2026-11-20 09:04:56:456 info: [BullMQ] BullMQ disconnected
2026-11-20 09:04:56:456 info: BullMQ disconnected
2026-11-20 09:04:56:456 info: [Redis] Connection closed
2026-11-20 09:04:56:456 info: [Redis] Disconnected
2026-11-20 09:04:56:456 info: Redis disconnected
⚠️ MongoDB disconnected. Attempting to reconnect...
MongoDB connection closed
2026-11-20 09:04:56:456 info: MongoDB disconnected
2026-11-20 09:04:56:456 info: Graceful shutdown completed
[nodemon] clean exit - waiting for changes before restart