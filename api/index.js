import { YoutubeTranscript } from 'youtube-transcript';
import { generateSpeechPayload, modelTemplate } from "../utilities/template.js";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from "@langchain/openai";
//import { ChatGoogleGenerativeAI } from '@langchain/google-genai'; // Must be uncommented for Gemini to work
import { fileURLToPath } from 'url';
import fs from "fs";
import path, {dirname} from "path"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const generate=async(req, res)=> {
    try {
      const { textInput, selections } = req.body;
      const promptTemplate = modelTemplate(selections);
      //#region Gemini model configuaration
      //Define the model configuration for Google Gemini
      // const model = new ChatGoogleGenerativeAI({
      //   apiKey: process.env.GOOGLE_GEMINI_API_KEY,
      //   model: 'gemini-1.5-pro',
      //   temperature:0,
      //   streaming: true, // Set to true if you want to stream the response
      // });
      //#endregion
      /**
       * ChatGPT 4o mini follows instructions better compared to other models at the time of development
       */
      const model = new ChatOpenAI({ model: "gpt-4o-mini" });
      const messages = [
        new SystemMessage(promptTemplate),
        new HumanMessage(JSON.stringify(textInput))
      ];
  
      // Invoke the model
      let result = await model.invoke(messages); 
      result=result.content.replace("```json\n", "").replace("\n```","").replace(/\\"/g, '"')
      result = JSON.parse(result); // Gemini 1.5 pro works but returns short audio length
      let final = result.podcast
  
      const promises = final.map((speech) => {
        return generateSpeechPayload(speech, selections); 
      });
      Promise.all(promises)
        .then(responses => {
          const data = responses.map(response => response?.data);
          const files = data.map((x) => {
            const tempFile = path.join(__dirname, `temp.mp3`);
            fs.appendFileSync(tempFile, Buffer.from(x?.audioContent, 'base64'));
            return tempFile
          })
          Promise.all(files)
            .then(() => {
              const outputFile = path.join(__dirname, `temp.mp3`);
              const mergedAudio = fs.readFileSync(outputFile);
              const base64Audio = mergedAudio.toString('base64');
              fs.unlinkSync(outputFile)
              console.info("Podcast generated successfully!")
              res.json({ audioContent: base64Audio, summary: result.summary, longTitle: result.longTitle });
            })
            .catch((error) => console.error("Error creating a file", error))
        })
        .catch(error =>
          console.error('Error:', error));
    } catch (e) {
      console.error("Full error:", e);
      return res.json({
        error: e.message,
        stack: e.stack,
      });
    }
  }
  /**
   * @note /transcribe only works locally.
   * @package ytdl-core is promising in working both locally and on the cloud. Best option is to host own server to server for this functionality alone.
   */
  export const transcribe=async (req, res) => {
    try {
      const videoUrl = req.body.videoUrl;
      YoutubeTranscript.fetchTranscript(videoUrl).then(x => {
        x = x.map(y => y.text).join(" ").replaceAll("&amp;#39;", '')
        res.json({ transcript: x })
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Transcription failed' });
    }
  }