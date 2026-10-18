
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadFiles() {
    try {
      const response = await fetch(`${API}/api/files`);
      if (!response.ok) throw new Error("Could not load records");
      setFiles(await response.json());
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function processFile() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/process`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message);
      }

      setMessage("File imported successfully!");
      await loadFiles();
    } catch (error) {
      setMessage(`Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">CLOUD FILE MANAGEMENT</p>
          <h1>S3 File Importer</h1>
          <p className="subtitle">
            Import text from Amazon S3 into PostgreSQL.
          </p>
        </div>
        <span className="status">
          <span className="dot" /> API Connected*
        </span>
      </header>

      <section className="stats">
        <article className="stat-card">
          <span>Total imported records</span>
          <strong>{files.length}</strong>
        </article>
        <article className="stat-card">
          <span>Storage destination</span>
          <strong>PostgreSQL</strong>
        </article>
        <article className="stat-card">
          <span>Source</span>
          <strong>Amazon S3</strong>
        </article>
      </section>

      <section className="panel import-panel">
        <div>
          <h2>Import a file</h2>
          <p>Fetch notes.txt from your private S3 bucket.</p>
        </div>
        <button onClick={processFile} disabled={loading}>
          {loading ? "Importing..." : "↓  Process S3 File"}
        </button>
      </section>

      {message && (
        <div className="message" role="status">
          {message}
        </div>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Import history</h2>
            <p>Files and extracted content stored in the database.</p>
          </div>
          <button className="secondary" onClick={loadFiles}>
            Refresh
          </button>
        </div>

        {files.length === 0 ? (
          <p className="empty">No imported records found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>File name</th>
                  <th>Extracted content</th>
                  <th>Imported at</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td>#{file.id}</td>
                    <td>{file.file_name}</td>
                    <td className="content-cell">{file.content}</td>
                    <td>
                      {new Date(file.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>Built with React · Node.js · AWS S3 · PostgreSQL</footer>
    </main>
  );
}

export default App;
