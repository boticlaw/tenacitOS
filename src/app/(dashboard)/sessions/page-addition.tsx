// Add this state at the top of SessionDetail function:
const [showTranscript, setShowTranscript] = useState(false);

// Add this button in the header section, before the close button:
<button
  onClick={() => setShowTranscript(true)}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.375rem 0.75rem",
    borderRadius: "0.5rem",
    background: "none",
    border: "1px solid var(--border)",
    cursor: "pointer",
    color: "var(--text-secondary)",
    fontSize: "0.75rem",
    flexShrink: 0,
  }}
  title="View full transcript"
>
  <FileText style={{ width: "14px", height: "14px" }} />
  Transcript
</button>

// Add this at the end of the return, before the closing </>:
{showTranscript && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 70,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(2px)",
    }}
    onClick={() => setShowTranscript(false)}
  >
    <div
      style={{
        width: "min(800px, 100vw)",
        height: "100%",
        backgroundColor: "var(--card)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <TranscriptViewer
        sessionKey={session.key}
        onClose={() => setShowTranscript(false)}
      />
    </div>
  </div>
)}
