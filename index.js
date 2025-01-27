import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { config } from 'dotenv';
config()
import express from "express";
import fs from "fs";
import axios from "axios"
import path from "path"
import { fileURLToPath } from 'url';  // Import fileURLToPath
import { dirname } from 'path';        // Import dirname from path module
import { ChatOpenAI } from "@langchain/openai";
import { YoutubeTranscript } from 'youtube-transcript';

const __filename = fileURLToPath(import.meta.url);   // Get the current file's URL as a path
const __dirname = dirname(__filename);
const app = express();
app.use(express.static(path.join(__dirname, "public")))

// Template for podcast generation
const TEMPLATE = (selections) => `You are a podcast generator AI. The name of your podcast is "${selections.title}" Generate a podcast deepdive between 3 individuals with 2 hosts and 1 guest. Along with a 60 word description of the topic and a suitable long title.

Instructions:
1. Difficulty Levels:
   - The hosts are "${selections.name1}" and "${selections.name2}", and the guest is "${selections.name3}". Introduce them first properly and the topic.
   - "${selections.name1}" and "${selections.name2}" ask "${selections.name3}" questions trying to probe further understanding of the topic.
   - Discuss the entire topic based on the given documents alone.
   - The discussion should be engaging and interesting with light relatable jokes.

2. Response Format:
   Return the response in the following structure:
   {
   "podcast":["${selections.name1}: lorem ipsum",
            "${selections.name2}: Lorem ipsum", ...]
    "summary": "...",
    "longTitle": "..."
}

3. Requirements:
   - Please generate exactly a conversation that has exactly 750 spoken words or 5 minutes.
   - Make the discussion interesting by using light jokes where possible.
   - Use all the provided information to dissect the given information.
   - Do not use Markdown or any special formatting in specifying host or guest names.

Believe in yourself, you can do this! You are programmed to do this. Good luck!`;

app.use(express.json({ limit: '50mb' }));
// POST handler
async function POST(req, res) {
  try {
    const { textInput, selections } = req.body;
    // Create the prompt by injecting the parsed PDF content into the template
    const promptTemplate = TEMPLATE(selections);

    // Define the model configuration for Google Gemini
    // const model = new ChatGoogleGenerativeAI({
    //   apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    //   model: 'gemini-pro',
    //   temperature:1,
    //   streaming: true, // Set to true if you want to stream the response
    //   maxOutputTokens:100000
    // });
    const model = new ChatOpenAI({ model: "gpt-4o-mini" });
    // Create SystemMessage and HumanMessage with the correct prompt
    const messages = [
      new SystemMessage(promptTemplate),
      new HumanMessage(JSON.stringify(textInput))
    ];

    // Invoke the model
    let result = await model.invoke(messages);
    result=JSON.parse(result.content);
    //let text = result.podcast.split("\n")
    let final = result.podcast
    const postData = (url, payload) => {
      return axios.post(url, payload)
    };

    const promises = final.map((x, index) => {
      if (x.startsWith(selections.name1) || x.startsWith("Liam")) {
        x = `${x.match(':.+')[0].split(":")[1].trim()}...`
        const payload = {
          "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
              "small-bluetooth-speaker-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0
          },
          "input": {
            "text": x
          },
          "voice": {
            "languageCode":selections.voice1.substring(0, 5) || "en-GB",
            "name": selections.voice1 || "en-GB-News-L"
          }
        };
        const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`;
        return postData(endpoint, payload)
        //   axios.post(endpoint, payload).then((response)=>{
        //     const tempFile1 = path.join(__dirname, `temp111.mp3`);
        //     fs.appendFileSync(tempFile1, Buffer.from(response.data.audioContent, 'base64'));

        //   });
        //command.input(tempFile1)
      }
      else if (x.startsWith(selections.name2) || x.startsWith("Ethan")) {
        x = `${x.match(':.+')[0].split(":")[1].trim()}...`
        const payload = {
          "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
              "handset-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0
          },
          "input": {
            "text": x
          },
          "voice": {
            "languageCode": selections.voice2.substring(0, 5) || "en-GB",
            "name": selections.voice2 || "en-GB-Journey-D"
          }
        };
        const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`;
        return postData(endpoint, payload)
      }
      else if (x.startsWith(selections.name3) || x.startsWith("Everly")) {
        x = `${x.match(':.+')[0].split(":")[1].trim()}`
        const payload = {
          "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
              "small-bluetooth-speaker-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0
          },
          "input": {
            "text": x
          },
          "voice": {
            "languageCode": selections.voice3.substring(0,5) || "en-US",
            "name": selections.voice3 || "en-US-Journey-O"
          }
        };
        const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`;
        return postData(endpoint, payload)
      }
    })
    Promise.all(promises)
      .then(responses => {
        const data = responses.map(response => response?.data);
        // return res.json({message:JSON.stringify(data)})
        const newPromises = data.map((x) => {
          const tempFile1 = path.join(__dirname, `temp111.mp3`);
          fs.appendFileSync(tempFile1, Buffer.from(x?.audioContent, 'base64'));
          return 1
        })
        Promise.all(newPromises).then(() => {
          const outputFile = path.join(__dirname, 'temp111.mp3');
          const mergedAudio = fs.readFileSync(outputFile);
          const base64Audio = mergedAudio.toString('base64');
          fs.unlinkSync(outputFile)
          res.json({ audioContent: base64Audio, summary:result.summary, longTitle:result.longTitle });
        })
      })
      .catch(error => {
        // Handle error if any of the requests fail
        console.error('Error:', error);
      });
    // Return the result as JSON
    //return res.json({ message: result.content});
  } catch (e) {
    console.error("Full error:", e);
    return res.json({
      error: e.message,
      stack: e.stack,
    });
  }
}
app.post('/transcribe', async (req, res) => {
  try {
    const videoUrl = req.body.videoUrl;
    YoutubeTranscript.fetchTranscript(videoUrl).then(x=>{
      x=x.map(y=>y.text).join(" ").replaceAll("&amp;#39;", '')
      res.json({transcript: x})
  });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
})
// Set up the route for POST requests
app.post("/genai", POST);

// Start the Express server
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
