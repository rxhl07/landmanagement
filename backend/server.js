import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { create } from "ipfs-http-client";

dotenv.config();
const ipfs = create({ url: process.env.IPFS_API_URL || "http://127.0.0.1:5001/api/v0" });

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

app.post("/pin", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const added = await ipfs.add(req.file.buffer);
    const cid = added.cid ? added.cid.toString() : added.path;
    return res.json({ cid, uri: `ipfs://${cid}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.post("/pin-json", async (req, res) => {
  try {
    const json = JSON.stringify(req.body);
    const added = await ipfs.add(json);
    const cid = added.cid ? added.cid.toString() : added.path;
    return res.json({ cid, uri: `ipfs://${cid}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
