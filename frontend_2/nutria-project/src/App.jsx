import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

function App() {
  const [paciente, setPaciente] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [plano, setPlano] = useState("");

  const gerarPlano = async () => {
    const res = await fetch("http://localhost/gerar-plano.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paciente, objetivo })
    });

    const data = await res.json();
    setPlano(JSON.stringify(data.plano || data, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-2xl">
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold text-center text-green-800">🍎 IA Nutricionista</h1>

          <Input
            placeholder="Nome do paciente"
            value={paciente}
            onChange={e => setPaciente(e.target.value)}
          />
          <Input
            placeholder="Objetivo (ex: emagrecimento, ganho de massa)"
            value={objetivo}
            onChange={e => setObjetivo(e.target.value)}
          />

          <Button onClick={gerarPlano} className="w-full bg-green-600 hover:bg-green-700">
            Gerar Plano Alimentar
          </Button>

          <Textarea
            className="mt-4 text-sm font-mono bg-gray-50 h-64"
            readOnly
            value={plano}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
