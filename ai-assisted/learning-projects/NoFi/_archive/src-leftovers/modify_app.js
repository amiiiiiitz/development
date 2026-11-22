const fs = require("fs");
const path = "App.jsx";
let content = fs.readFileSync(path, "utf8");

// 1. Add import for AudioProvider, useAudio
content = content.replace(
  'import QueueDrawer from "./shared/components/QueueDrawer.jsx";',
  'import QueueDrawer from "./shared/components/QueueDrawer.jsx";\nimport { AudioProvider, useAudio } from "./features/audio/index.jsx";'
);

// 2. Remove AUDIO_CACHE_NAME constant
content = content.replace('const AUDIO_CACHE_NAME = "mp3-offline-cache-v1";\n', '');

// 3. Remove isPreparingAudio state
content = content.replace('const [isPreparingAudio, setIsPreparingAudio] = useState(false);\n', '');

// 4. Remove volume state
content = content.replace('const [volume, setVolume] = useState(0.8);\n', '');

// 5. Remove playbackRate state
content = content.replace('const [playbackRate, setPlaybackRate] = useState(1);\n', '');

// 6. Remove audioSource state
content = content.replace('const [audioSource, setAudioSource] = useState(null);\n', '');

// 7. Remove audioRef ref
content = content.replace('const audioRef = useRef(null);\n', '');

// 8. Remove audioSourceRef ref
content = content.replace('const audioSourceRef = useRef(null);\n', '');

fs.writeFileSync(path, content, "utf8");
console.log("Phase 1 done: imports and state declarations");
