import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AtendimentoDetalhes from "./AtendimentoDetalhes";
import PacienteDetalhes from "./PacienteDetalhes";

function App() {
  const [aba, setAba] = useState("pacientes");

  // Estados Paciente
  const [pacientes, setPacientes] = useState([]);
  const [novoPaciente, setNovoPaciente] = useState({
    nome: "",
    email: "",
    data_nascimento: "",
    cpf: "",
  });
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);

  // Estados Atendimento
  const [atendimentos, setAtendimentos] = useState([]);
  const [novoAtendimento, setNovoAtendimento] = useState({
    paciente_id: "",
    paciente: "",
    descricao: "",
  });

  const API_BASE = "http://localhost:8000/api.php";
  // const API_BASE = "http://172.19.142.153:8000/api.php";

  useEffect(() => {
    buscarPacientes();
    buscarAtendimentos();
  }, []);

  // === Pacientes ===
  const [mostrarModalPaciente, setMostrarModalPaciente] = useState(false);

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
      setMostrarModalPaciente(false);  // <-- FECHA MODAL
      alert("✅ Paciente cadastrado com sucesso!");
    } catch (error) {
      alert("Erro ao cadastrar paciente.");
    }
  };

  const formatarCPF = (value) => {
    return value
      .replace(/\D/g, "") // remove tudo que não é número
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14); // máximo 14 caracteres (000.000.000-00)
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

  if (pacienteSelecionado) {
    return (
      <div className="container mt-4">
        <PacienteDetalhes
          paciente={pacienteSelecionado}
          onVoltar={() => setPacienteSelecionado(null)}
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

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Pacientes</h4>
            <button className="btn btn-success" onClick={() => setMostrarModalPaciente(true)}>
              + Cadastrar
            </button>
          </div>

          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Nascimento</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr
                  key={p.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setPacienteSelecionado(p)} // Mobile: toque simples
                  onDoubleClick={() => setPacienteSelecionado(p)} // Desktop: duplo clique
                >
                  <td>{p.nome}</td>
                  <td>{p.email || "—"}</td>
                  <td>{p.data_nascimento || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                {/* <th>ID</th> */}
                <th>Paciente</th>
                <th>Descrição</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.length > 0 ? (
                atendimentos.map((a) => (
                  <tr key={a.id}>
                    {/* <td>{a.id}</td> */}
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
      {/* Modal cadastrar paciente */}
      <div
        className={`modal fade ${mostrarModalPaciente ? "show d-block" : ""}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Cadastrar Paciente</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setMostrarModalPaciente(false)}
              />
            </div>

            <div className="modal-body">
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
                  <label className="form-label">CPF</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    maxLength={14}
                    value={novoPaciente.cpf}
                    onChange={(e) =>
                      setNovoPaciente({
                        ...novoPaciente,
                        cpf: formatarCPF(e.target.value),
                      })
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
          </div>
        </div>
      </div>

      {/* Background do modal */}
      {mostrarModalPaciente && (
        <div
          className="modal-backdrop fade show"
          onClick={() => setMostrarModalPaciente(false)}
        ></div>
      )}
    </div>
  ); 
}

function formatarDataLocal(dataString) {
  if (!dataString) return "-";

  const [datePart] = dataString.split(" ");
  const [ano, mes, dia] = datePart.split("-");

  return `${dia}/${mes}/${ano}`;
}

export default App;
