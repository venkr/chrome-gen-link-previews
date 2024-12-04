<img src="images/link-icon.webp" width="250">

# Generative Link Previews

The Internet is overwhelming - it's easy to end up with dozens, or hundreds of open tabs. How do you get the benefits of all this information, while staying on track?

<img src="image-1.png" width="450">

Generative Link Previews lets you get a useful high level understanding of a link by Shift + hovering over it.
It's been carefully prompt engineered to ensure that it doesn't give vague general answers, instead focusing on pulling out the specific details that are most useful to you!

Built for the [Google Chrome Built-in AI Challenge](https://googlechromeai.devpost.com/)

## Features

- Shift + Hover over a link to get a useful high level understanding of a link
- Hybrid AI support - switch between Gemini Nano and Gemini Pro with a click of a button
- Fully-local & privacy preserving - no data leaves your device (with Gemini Nano)
- Multilingual support for 40+ languages (with Gemini Pro)

## Models

- Gemini Nano:
  - Fully-local model, no data leaves your device
  - Supported for English only
  - Uses upto 1200 characters of context from a webpage

- Gemini Pro:
  - Powerful cloud model, supports over 40 languages
  - Higher accuracy & conformance to style 
  - Uses upto 15000 characters of context from a webpage

## Running this extension

1. Clone this repository.
2. Run `npm install` in the project directory.
3. **[IMPORTANT]** Edit `background.js` to replace the placeholder API key with your own
4. Run `npm run build` in the project directory to build the extension.
5. Load the newly created `dist` directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
6. Go to any page and Shift + hover over a link to see a preview.
