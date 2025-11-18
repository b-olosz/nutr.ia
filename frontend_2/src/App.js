import React, { useState } from "react";

function App() {
  const [paciente, setPaciente] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [plano, setPlano] = useState(null);

  const gerarPlano = async () => {
    const res = await fetch("http://localhost:8000/gerar-plano.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paciente, objetivo })
    });
    const data = await res.json();
    setPlano(data);
  };

  return (
    <div className="app">
      <h2>Gerador de Plano Alimentar</h2>
      <input
        placeholder="Nome do paciente"
        value={paciente}
        onChange={(e) => setPaciente(e.target.value)}
        />
      <h2>Digite as informações:</h2>
      <input
        // placeholder="Objetivo (ganho, perda, manutenção)"
        value={objetivo}
        onChange={(e) => setObjetivo(e.target.value)}
      />
      <button onClick={gerarPlano}>Gerar Plano</button>

      {plano && (
        <pre>{JSON.stringify(plano, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;
