let session;

// TODO: Replace with your own API key
const apiKey = "";

async function* runRemotePrompt(prompt, params) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let summary = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

    for (const line of lines) {
      const data = JSON.parse(line.substring(6));
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        summary += data.candidates[0].content.parts[0].text;
        yield summary;
      }
    }
  }
}

async function runPrompt(prompt, params) {
  try {
    if (!session) {
      session = await chrome.aiOriginTrial.languageModel.create(params);
    }
    return session.promptStreaming(prompt);
  } catch (e) {
    console.log("Prompt failed");
    console.error(e);
    console.log("Prompt:", prompt);
    // Reset session
    reset();
    throw e;
  }
}

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(async function (msg) {
    console.log("Received message:", msg);

    if (msg.type === "urlSummaryRequested") {
      try {
        // fetch url content
        const response = await fetch(msg.url);
        const text = await response.text();

        // Parse the HTML to get og:image using regex since DOMParser isn't available
        const ogImageMatch = text.match(
          /<meta[^>]*(property|name)="og:image"[^>]*content="([^"]*)"[^>]*>/i
        );
        let ogImage = ogImageMatch ? ogImageMatch[2] : null;
        console.log("Got ogImage", ogImage);

        // convert relative url to absolute
        if (ogImage && !ogImage.startsWith("http")) {
          ogImage = new URL(ogImage, msg.url).href;
        }

        port.postMessage({
          type: "urlOgImageResult",
          ogImage: ogImage,
        });

        let truncated = text.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ""
        );
        // remove style elements
        truncated = truncated.replace(
          /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
          ""
        );
        truncated = truncated.replace(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/g, "");
        console.log("Cleaned text", truncated);

        // Get the users language & model preferences
        const { language, model } = await chrome.storage.sync.get([
          "language",
          "model",
        ]);
        const useRemote = model === "pro";

        if (!useRemote) {
          truncated = truncated.substring(0, 1200);
        }
        if (useRemote) {
          truncated = truncated.substring(0, 15000);
        }

        // Generate summary
        const pro_prompt =
          `Summarize the following text. It should contain a single bolded line that's a high level overview, then 3-4 bullet points, starting with a different emoji for each, and one to two bolded words, then one sentence.

          Example output - short & well-formatted:
          **Pueblos Mancomunados is an ecotourism project in Oaxaca, Mexico**
          - 🏠 **Villages:** Eight remote villages in Oaxaca
          - 🏃 **Activities:** High-country trails, canyons, canves, waterfalls
          - 📚 **Guidebooks:** Award winning guidebooks available

          Avoid using generic words, instead focusing on unique words & details from the article to sound sophisticated. Ensure you capture unique juicy details.
          Always prefer to use more specific words over generic ones, eg: instead of saying "museums" give the name of a specific museum in the article, etc.
          Ensure all the sentences are extremely short. Do not have more than 10 words per bullet point.
    
          The user's preferred language is ${language}, please output in this language.

          Text to summarize: \n
          ` + truncated;

        const nano_prompt =
          `Summarize the following text. It should contain a single bolded line that's a high level overview, then 3-4 bullet points, starting with a different emoji for each, and one to two bolded words, then one sentence.

          Example output - short & well-formatted:
          **Pueblos Mancomunados is an ecotourism project in Oaxaca, Mexico**
          - 🏠 **Villages:** Eight remote villages in Oaxaca
          - 🏃 **Activities:** High-country trails, canyons, canves, waterfalls
          - 📚 **Guidebooks:** Award winning guidebooks available

          Text to summarize: \n` + truncated;

        let stream;
        if (useRemote || language !== "English") {
          stream = runRemotePrompt(pro_prompt);
        } else {
          stream = await runPrompt(nano_prompt);
        }

        for await (const chunk of stream) {
          console.log(chunk);
          port.postMessage({
            type: "urlSummaryResult",
            summary: chunk,
          });
        }
      } catch (error) {
        console.error("Error processing URL:", error);
        port.postMessage({
          type: "urlSummaryError",
          error: error.message,
        });
      }
    }
  });
});
