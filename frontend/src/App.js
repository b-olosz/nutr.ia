import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AtendimentoDetalhes from "./AtendimentoDetalhes";

function App() {
  const [aba, setAba] = useState("pacientes");

  // Estados Paciente
  const [pacientes, setPacientes] = useState([]);
  const [novoPaciente, setNovoPaciente] = useState({
    nome: "",
    email: "",
    data_nascimento: "",
  });

  // Estados Atendimento
  const [atendimentos, setAtendimentos] = useState([]);
  const [novoAtendimento, setNovoAtendimento] = useState({
    paciente_id: "",
    paciente: "",
    descricao: "",
  });

  const API_BASE = "http://localhost:8000/api.php";

  useEffect(() => {
    buscarPacientes();
    buscarAtendimentos();
  }, []);

  // === Pacientes ===
  const buscarPacientes = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=listar_pacientes`);
      const data = await res.json();
      setPacientes(data);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    }
  };

  const cadastrarPaciente = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}?action=cadastrar_pacientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoPaciente),
      });
      setNovoPaciente({ nome: "", email: "", data_nascimento: "" });
      buscarPacientes();
      alert("✅ Paciente cadastrado com sucesso!");
    } catch (error) {
      alert("Erro ao cadastrar paciente.");
    }
  };

  // === Atendimentos ===
  const buscarAtendimentos = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=listar_atendimentos`);
      const data = await res.json();
      setAtendimentos(data);
    } catch (error) {
      console.error("Erro ao buscar atendimentos:", error);
    }
  };

  const cadastrarAtendimento = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}?action=cadastrar_atendimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoAtendimento),
      });
      setNovoAtendimento({ paciente_id: "", descricao: "" });
      buscarAtendimentos();
      alert("✅ Atendimento cadastrado!");
    } catch (error) {
      alert("Erro ao cadastrar atendimento.");
    }
  };

  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);

  if (atendimentoSelecionado) {
    return (
      <div className="container mt-4">
        <AtendimentoDetalhes
          atendimento={atendimentoSelecionado}
          onVoltar={() => setAtendimentoSelecionado(null)}
        />
      </div>
    );
  }


  // === Interface ===
  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">📋 Nutr.IA</h2>

      {/* Abas */}
      <div className="d-flex justify-content-center mb-4">
        <button
          className={`btn mx-2 ${
            aba === "pacientes" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setAba("pacientes")}
        >
          Pacientes
        </button>
        <button
          className={`btn mx-2 ${
            aba === "atendimentos" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setAba("atendimentos")}
        >
          Cadastrar Atendimento
        </button>
        <button
          className={`btn mx-2 ${
            aba === "listar" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setAba("listar")}
        >
          Lista de Atendimentos
        </button>
      </div>

      {/* Aba Pacientes */}
      {aba === "pacientes" && (
        <div className="card p-4 shadow">
          <h4>Cadastrar Paciente</h4>
          <form onSubmit={cadastrarPaciente}>
            <div className="mb-3">
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-control"
                required
                value={novoPaciente.nome}
                onChange={(e) =>
                  setNovoPaciente({ ...novoPaciente, nome: e.target.value })
                }
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={novoPaciente.email}
                onChange={(e) =>
                  setNovoPaciente({ ...novoPaciente, email: e.target.value })
                }
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Data de Nascimento</label>
              <input
                type="date"
                className="form-control"
                value={novoPaciente.data_nascimento}
                onChange={(e) =>
                  setNovoPaciente({
                    ...novoPaciente,
                    data_nascimento: e.target.value,
                  })
                }
              />
            </div>
            <button type="submit" className="btn btn-success w-100">
              Salvar Paciente
            </button>
          </form>
        </div>
      )}

      {/* Aba Cadastrar Atendimento */}
      {aba === "atendimentos" && (
        <div className="card p-4 shadow">
          <h4>Novo Atendimento</h4>
          <form onSubmit={cadastrarAtendimento}>
            <div className="mb-3">
              <label className="form-label">Paciente</label>
              <select
                className="form-select"
                required
                value={novoAtendimento.paciente_id}
                onChange={(e) =>
                  setNovoAtendimento({
                    ...novoAtendimento,
                    paciente_id: e.target.value,
                    paciente_id: e.target.value,
                  })
                }
              >
                <option value="">Selecione...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Descrição</label>
              <textarea
                className="form-control"
                required
                value={novoAtendimento.descricao}
                onChange={(e) =>
                  setNovoAtendimento({
                    ...novoAtendimento,
                    descricao: e.target.value,
                  })
                }
              ></textarea>
            </div>
            <button type="submit" className="btn btn-success w-100">
              Salvar Atendimento
            </button>
          </form>
        </div>
      )}

      {/* Aba Lista de Atendimentos */}
      {aba === "listar" && (
        <div className="card p-4 shadow">
          <h4>Atendimentos Cadastrados</h4>
          <table className="table table-striped mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Descrição</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.length > 0 ? (
                atendimentos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.paciente_nome}</td>
                    <td>{a.descricao}</td>
                    <td>
                      {a.data_criacao
                        ? new Date(a.data_criacao).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setAtendimentoSelecionado(a)}
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    Nenhum atendimento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
