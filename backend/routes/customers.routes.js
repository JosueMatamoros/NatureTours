import { Router } from "express";
import { upsertCustomer } from "../controllers/customers.controller.js";

const router = Router();

router.post("/", upsertCustomer);

export default router;
