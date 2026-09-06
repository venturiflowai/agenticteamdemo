import ClaimsDashboard from './ClaimsDashboard';

export const APP_NAME = 'Agentic Team Demo';

function App() {
  const sha = import.meta.env.VITE_GIT_SHA ?? 'unknown';

  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>
        Build <code>{sha}</code>
      </p>
      <ClaimsDashboard />
    </main>
  );
}

export default App;
