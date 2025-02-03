import axios from "axios"
/**
 * This function is used by the LLM telling it what to implement and the response to return
 * @param {String} name1 of the first speaker
 * @param {String} name2 of the second speaker
 * @param {String} name3 of the third expert speaker
 */
export const modelTemplate = ({ name1, name2, name3, title }) => `You are a podcast generator AI. The name of your podcast is "${title}" Generate a podcast deepdive between 3 individuals with 2 hosts and 1 guest. Along with a 60 word description of the topic and a suitable long title.

Instructions:
1. Difficulty Levels:
   - The hosts are "${name1}" and "${name2}", and the guest is "${name3}". Introduce them first properly and the topic.
   - "${name1}" and "${name2}" ask "${name3}" questions trying to probe further understanding of the topic.
   - Discuss the entire topic based on the given documents alone.
   - The discussion should be engaging and interesting with light relatable jokes.

2. Response Format as an object:
   Return the response in the following structure:
   {
   "podcast":["${name1}: lorem ipsum",
            "${name2}: Lorem ipsum", ...]
    "summary": "...",
    "longTitle": "..."
}

3. Requirements:
   - Please generate exactly a conversation that has exactly 750 spoken words or 5 minutes.
   - Make the discussion interesting by using light jokes where possible.
   - Use all the provided information to dissect the given information.
   - Do not use Markdown or any special formatting in specifying host or guest names.

You are built for this.  Success is in your code. Now, execute. Good luck!`;

/**
 * Sends an API request and returns a promise that yes it will be done.
 * @param {String} url 
 * @param {JSON} payload 
 * @returns {Promise<Response>} A promise this request will be fulfilled
 */
export const postData = (url, payload) => {
    return axios.post(url, payload)
};

export const generateSpeechPayload = (speech, selections) => {
    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`;
    let voice, effectsProfileId;

    if (speech.startsWith(selections.name1) || speech.startsWith("Liam")) {
        speech = `${speech.match(':.+')[0].split(":")[1].trim()}...`;
        voice = {
            languageCode: selections.voice1.substring(0, 5) || "en-GB",
            name: selections.voice1 || "en-GB-News-L"
        };
        effectsProfileId = ["small-bluetooth-speaker-class-device"];
    } else if (speech.startsWith(selections.name2) || speech.startsWith("Ethan")) {
        speech = `${speech.match(':.+')[0].split(":")[1].trim()}...`;
        voice = {
            languageCode: selections.voice2.substring(0, 5) || "en-GB",
            name: selections.voice2 || "en-GB-Journey-D"
        };
        effectsProfileId = ["handset-class-device"];
    } else if (speech.startsWith(selections.name3) || speech.startsWith("Everly")) {
        speech = `${speech.match(':.+')[0].split(":")[1].trim()}`;
        voice = {
            languageCode: selections.voice3.substring(0, 5) || "en-US",
            name: selections.voice3 || "en-US-Journey-O"
        };
        effectsProfileId = ["small-bluetooth-speaker-class-device"];
    } else {
        // Handle the default case, if none of the conditions are met.  Important!
        console.warn("No matching voice found for:", speech);
        return Promise.reject("No matching voice found"); // Or return a default payload/promise
    }

    const payload = {
        audioConfig: {
            audioEncoding: "MP3",
            effectsProfileId: effectsProfileId,
            pitch: 0,
            speakingRate: 0
        },
        input: {
            text: speech
        },
        voice: voice
    };

    return postData(endpoint, payload);
};