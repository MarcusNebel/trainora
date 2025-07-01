import { useState } from 'react'

export default function Summarizer() {
  const [inputText, setInputText] = useState("")
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSummarize = async () => {
    setLoading(true)
    setError("")
    setSummary("")

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Fasse diesen Text zusammen:\n\n${inputText}` })
      })

      const data = await res.json()

      if (data.response) {
        setSummary(data.response)
      } else {
        setError("Keine Zusammenfassung erhalten.")
      }
    } catch (err) {
      setError("Fehler bei der Anfrage.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Text zusammenfassen</h2>
      <textarea
        style={styles.textarea}
        placeholder="Text hier eingeben..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button onClick={handleSummarize} style={styles.button} disabled={loading || !inputText}>
        {loading ? "Zusammenfassen..." : "Zusammenfassen"}
      </button>

      {error && <div style={styles.error}>{error}</div>}
      {summary && (
        <div style={styles.resultCard}>
          <h3>Zusammenfassung</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "20px",
    borderRadius: "12px",
    backgroundColor: "#f9fafb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    fontFamily: "sans-serif"
  },
  heading: {
    fontSize: "24px",
    marginBottom: "16px"
  },
  textarea: {
    width: "100%",
    height: "150px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    marginBottom: "16px"
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px"
  },
  resultCard: {
    marginTop: "24px",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px"
  },
  error: {
    color: "red",
    marginTop: "10px"
  }
}