import './App.css'

function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Local-only writing assistance</p>
        <h1>Local Proofreader</h1>
        <p className="lede">
          A private Grammarly-style editor that checks grammar, spelling, and
          style in your browser without sending drafts to a server.
        </p>
        <div className="heroActions">
          <a href="https://github.com/baditaflorin/local-proofreader">
            Star on GitHub
          </a>
          <a href="https://www.paypal.com/paypalme/florinbadita">
            Support via PayPal
          </a>
        </div>
      </section>
    </main>
  )
}

export default App
