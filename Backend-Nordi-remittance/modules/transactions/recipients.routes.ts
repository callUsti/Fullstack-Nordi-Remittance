import { Router } from "express";
import TransactionController from "./transactions.controller.js";
import { authenticate, verifyAccountStatus } from "../../middleware/auth.middleware.js";
import { sanitizeInput } from "../../middleware/security.middleware.js";
import { requestLoggingMiddleware } from "../../middleware/core.middleware.js";

const router = Router();

router.use(requestLoggingMiddleware);
router.use(sanitizeInput);
router.use(authenticate);
router.use(verifyAccountStatus);

router.get("/", TransactionController.getRecipients);
router.post("/", TransactionController.createRecipient);
router.get("/favorites", TransactionController.getRecipients);
router.get("/recent", TransactionController.getRecipients);

export default router;

