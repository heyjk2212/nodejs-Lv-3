import express from "express";
import CategoriesRouter from "./routes/categories.router.js";
import MenusRouter from "./routes/menus.router.js";

const router = express.Router();
const app = express();
const PORT = 4004;

app.use(express.json()); // body parser

router.get("/", (req, res) => {
  return res.status(200).json({ message: "Success" });
});

app.use("/api", [router, CategoriesRouter, MenusRouter]);

app.listen(PORT, () => {
  console.log(PORT, `${PORT} 포트로 서버가 열렸어요!`);
});

export default router;
