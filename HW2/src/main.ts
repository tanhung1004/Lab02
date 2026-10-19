
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Application root not found");
}

app.innerHTML = `
  <main class="app-container">
    <h1>WaveFlow</h1>
    <h2>Concurrent FIFO Audio Visualizer</h2>
    <p>TypeScript + Vite setup completed.</p>
  </main>
`;
