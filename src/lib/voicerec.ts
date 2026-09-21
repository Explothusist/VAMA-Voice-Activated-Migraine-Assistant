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
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

let recognition: SpeechRecognition;

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
function startListening() {
  if (!recognition) {
    console.error(
      "Speech recognition is not supported in this browser."
    );
    return;
  }
  recognition.start();
}

function goToPage(page: string) {
    recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    startListening()

    recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
      .toLowerCase()
      .trim();

    console.log("Heard:", transcript);

    if (transcript.includes(open )) {
      window.location.href = `/${page}`;
    } else if (transcript.includes("open home")) {
      window.location.href = "/";
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event);
  };
}