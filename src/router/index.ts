import { Router } from "express";

const router = Router();

router.get("/status", (req, res, next) => {
  res.json("Live");
});

export default router;
