import type { SpeechPatternLink } from "./utils.js"

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

let recognition: SpeechRecognition;
let shouldListen = false;

//let page: string = "";



/*if (SpeechRecognitionAPI) {
  recognition = new SpeechRecognitionAPI();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
      .toLowerCase()
      .trim();

    console.log("Heard:", transcript);

    if (transcript.includes("open dashboard")) {
      window.location.href = "/dashboard";
    } else if (transcript.includes("open home")) {
      window.location.href = "/";
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event);
  };
}
*/
export function startListening() {
    if (typeof window === "undefined") {
        console.log("Window is undefined");
        return false;
    }

    const browserWindow = window as Window;
    const SpeechRecognitionAPI =
        browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
        console.error(
            "Speech recognition is not supported in this browser."
        );
        return false;
    }

    recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    return true;
}

  function startRecognition() {
    if (!recognition || !shouldListen || window.speechSynthesis?.speaking) {
      return;
    }

    try {
      recognition.start();
    } catch {
      // The browser can reject a start while a previous session is closing.
    }
  }

export function listenForIdentifiers(identifiers: SpeechPatternLink[]) {
    if (!startListening()) {
        console.log("Start Listening Failed");
        return;
    }

      shouldListen = true;

    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex] ||
        event.results[event.results.length - 1];
      const transcript = result[0].transcript
            .toLowerCase()
            .trim();

        console.log("Heard:", transcript);

        for (let i = 0; i < identifiers.length; i++) {
            if (transcript.includes(identifiers[i].identifier.toLowerCase())) {
                window.location.href = identifiers[i].href;
            }
        }
    }

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event);
    };

    recognition.onend = () => {
      if (!window.speechSynthesis?.speaking) {
        startRecognition();
      }
    };

    startRecognition();
}

function readPage() {
    const text = document.body.innerText;

    if (!text.trim()) {
        console.log("There is no text to read.");
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = 'en-US';
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
}

export function textToSpeech(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

    if (recognition) {
    try {
      recognition.stop();
    } catch {
      // The recognition session may already be stopped.
    }
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = 'en-US';
    speech.rate = 1.5;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onend = () => {
      startRecognition();
    };

    window.speechSynthesis.speak(speech);
}