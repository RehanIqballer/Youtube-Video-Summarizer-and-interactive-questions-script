(async function () {
    const OPENAI_API_KEY = "your_api_key"; // Replace with your OpenAI API key, keep the quotations
    let transcriptData = []; 


    function clickShowTranscriptButton() {
        const showTranscriptButton = document.querySelector('button[aria-label="Show transcript"]');
        
        if (showTranscriptButton) {
            showTranscriptButton.click();
            console.log('Show transcript button clicked successfully.');
            return true;
        } else {
            console.error('Show transcript button not found.');
            return false;
        }
    }

    function waitForCondition(conditionFn, interval = 100, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkCondition = () => {
                if (conditionFn()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timed out waiting for condition.'));
                } else {
                    setTimeout(checkCondition, interval);
                }
            };

            checkCondition();
        });
    }

    function extractTranscript() {
        transcriptData = []; 
        const transcriptSegments = document.querySelectorAll('ytd-transcript-segment-renderer');

        transcriptSegments.forEach(segment => {
            const timeElement = segment.querySelector('.segment-timestamp');
            const textElement = segment.querySelector('.segment-text');

            const time = timeElement ? timeElement.textContent.trim() : 'No timestamp';
            const text = textElement ? textElement.textContent.trim() : '';

            if (text) {
                transcriptData.push({ time, text });
            }
        });

        return transcriptData.length > 0;
    }


    async function askChatGPT(question) {
        if (transcriptData.length === 0) {
            console.error("No transcript data available. Extract the transcript first.");
            return;
        }

        console.log("Sending question to ChatGPT...");

        const transcriptText = transcriptData.map(segment => `[${segment.time}] ${segment.text}`).join("\n");

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are an AI assistant that analyzes YouTube transcripts and provides answers with timestamps." },
                        { role: "user", content: `Here is the transcript of a YouTube video:\n\n${transcriptText}\n\nAnswer the following question with references to timestamps when relevant:\n${question}` }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                console.log("--- ChatGPT Response ---");
                console.log(data.choices[0].message.content);
                console.log("--- End of Response ---");
            } else {
                console.error("Error: No valid response from ChatGPT.");
            }
        } catch (error) {
            console.error("ChatGPT API request failed:", error.message);
        }
    }


    async function main() {
        const buttonClicked = clickShowTranscriptButton();

        if (!buttonClicked) {
            console.error('Cannot proceed without clicking the Show transcript button.');
            return;
        }

        try {
            await waitForCondition(() => document.querySelectorAll('ytd-transcript-segment-renderer').length > 0, 200, 10000);
            console.log('Transcript loaded successfully.');

            if (!extractTranscript()) {
                console.warn('No transcript found.');
                return;
            }

            console.log('Transcript extracted and stored successfully.');
            console.log('You can now ask questions using: askChatGPT("Your question here")');
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    main();

    window.askChatGPT = askChatGPT;
})();
