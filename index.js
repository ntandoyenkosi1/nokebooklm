import { config } from 'dotenv';
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';
import { transcribe, generate } from "./api/index.js"
config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json({ limit: '50mb' }));
app.get("/", (__req, res) => {
  res.sendFile(__dirname + "/public/index.html");
})
app.post("/generate", generate);
app.post('/transcribe', transcribe);
// Start the Express server
app.listen(process.env.PORT || 5001, () => {
  console.log(`Server is running on port ${process.env.PORT || 5001}`);
});
