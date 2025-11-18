import React, { useState, useEffect } from "react";

function AtendimentoDetalhes({ atendimento, onVoltar }) {
  const [inputChat, setInputChat] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [historicoChat, setHistoricoChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState("");
  const [refeicoes, setRefeicoes] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [refeicaoSelecionada, setRefeicaoSelecionada] = useState(null);
  const [itensRefeicao, setItensRefeicao] = useState({ tabela: [], nutrientes: [] });
  const [abaPainel, setAbaPainel] = useState("planos"); 
  const [showModalPlano, setShowModalPlano] = useState(false);
  const [descricaoPlano, setDescricaoPlano] = useState("");
  const [showModalRefeicao, setShowModalRefeicao] = useState(false);
  const [showModalItem, setShowModalItem] = useState(false);
  const [novaRefeicao, setNovaRefeicao] = useState({
    descricao: "",
    horario: ""
  });
  const [celulaEditando, setCelulaEditando] = useState(null);
  const [novoItem, setNovoItem] = useState({
    descricao: "",
    quantidade: "",
    unidade_medida: ""
  });

  const API_BASE = "http://localhost:8000/api.php";

  const carregarPlanos = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=listar_planos&atendimento_id=${atendimento.id}`);
      const json = await res.json();
      console.log(json)
      setPlanos(json);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    }
  };

  React.useEffect(() => {
    carregarPlanos();
  }, [atendimento.id]);

  const carregarRefeicoes = async () => {
    const res = await fetch(`${API_BASE}?action=listar_refeicoes&id_plano=${atendimento.plano_id}`);
    const data = await res.json();
    setRefeicoes(data);
  };

  React.useEffect(() => {
    carregarRefeicoes();
  }, []);

  const carregarRefeicoesDoPlano = async (planoId) => {
    try {
      const res = await fetch(`${API_BASE}?action=listar_refeicoes&id_plano=${planoId}`);
      const json = await res.json();

      setRefeicoes(json);
    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
      setRefeicoes([]);
    }
  };

  const enviarMensagem = async () => {
    if (!inputChat.trim()) return;

    // Adiciona a mensagem do usuário no chat
    const msgUser = { role: "user", text: inputChat };
    setChatMessages((prev) => [...prev, msgUser]);
    setHistoricoChat((prev) => [...prev, msgUser]);
    setInputChat("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}?action=chat_ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atendimento_id: atendimento.id,
          paciente: atendimento.paciente_nome,
          mensagem: inputChat,
          historico: historicoChat, // envia histórico completo
        }),
      });

      const text = await res.text();
      console.log("📦 Resposta IA:", text);

      const data = JSON.parse(text);

      // resposta textual da IA
      const respostaTexto =
        data.resposta_textual ||
        data.resposta ||
        "(sem resposta da IA)";

      const msgIA = { role: "assistant", text: respostaTexto };

      // adiciona mensagem da IA ao chat e histórico
      setChatMessages((prev) => [...prev, msgIA]);
      setHistoricoChat((prev) => [...prev, msgIA]);

      // se vierem refeições, adiciona automaticamente
      if (data.refeicoes && data.refeicoes.length > 0) {
        for (const r of data.refeicoes) {
          // salva cada refeição na API
          await fetch(`${API_BASE}?action=salvar_refeicao_ia`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plano_id: planoSelecionado,
              descricao: r.nome || r.descricao || "Nova refeição",
              horario: r.horario || "00:00",
            }),
          });
        }

        // recarrega refeições do plano após inserir
        carregarRefeicoesDoPlano(planoSelecionado);
      }
    } catch (err) {
      console.error("❌ Erro no envio:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Erro ao enviar mensagem para IA." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planoSelecionado) {
      fetch(`${API_BASE}?action=listar_historico&atendimento_id=${planoSelecionado}`)
        .then(res => res.json())
        .then(setChatMessages)
    }
  }, [planoSelecionado])

  const carregarItensDaRefeicao = async (refeicaoId) => {
    setRefeicaoSelecionada(refeicaoId);
    const res = await fetch(`${API_BASE}?action=listar_itens&refeicao_id=${refeicaoId}`);
    const data = await res.json();

    // Agrupar nutrientes dinamicamente
    const nutrientes = [...new Set(data.map(v => v.nome_nutriente))];
    const agrupado = data.reduce((acc, cur) => {
      const nome = cur.descricao;
      if (!acc[nome]) acc[nome] = {id: cur.id, descricao: nome, quantidade: cur.quantidade, unidade_medida: cur.unidade_medida };
      acc[nome][cur.nome_nutriente] = cur.qtde_nutri;
      return acc;
    }, {});
    const tabela = Object.values(agrupado);

    setItensRefeicao({ tabela, nutrientes });
  };

  const salvarPlano = async () => {
    if (!descricaoPlano.trim()) {
      alert("Informe uma descrição para o plano.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}?action=salvar_plano`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ atendimento_id: atendimento.id, descricao: descricaoPlano })
      });

      const result = await response.json();

      if (result.ok) {
        alert("Plano criado com sucesso!");
        setShowModalPlano(false);
        setDescricaoPlano("");
        carregarPlanos(); // <- recarrega os planos existentes
      } else {
        alert("Erro ao criar plano.");
      }
    } catch (e) {
      console.error("Erro ao salvar plano:", e);
      alert("Erro de conexão com o servidor.");
    }
  };

  const salvarEdicao = async (item, campo) => {
    try {
      await fetch(`${API_BASE}?action=atualizar_item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          campo,
          valor: item[campo],
        }),
      });
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
    }
    setCelulaEditando(null);
  };

  return (
    <div className="card p-4 shadow">
      <button className="btn btn-outline-secondary mb-3" onClick={onVoltar}>
        ← Voltar
      </button>

      <h4>Atendimento #{atendimento.id}</h4>
      <p><b>Paciente:</b> {atendimento.paciente_nome}</p>
      <p><b>Descrição:</b> {atendimento.descricao}</p>

      <hr />

      <div className="row">
        <div className="col-md-6 border-end">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="m-0">Planos Alimentares</h5>
              <button onClick={() => setShowModalPlano(true)}>
                +
              </button>
            </div>
          <div className="p-2 bg-light rounded" style={{ minHeight: "200px" }}>
            <select
              className="form-select mb-3"
              value={planoSelecionado}
              onChange={(e) => {
                const id = e.target.value;
                setPlanoSelecionado(id);
                carregarRefeicoesDoPlano(id);
              }}
            >
              <option value="">-- Escolher um plano --</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descricao}
                </option>
              ))}
            </select>

            {planoSelecionado && (
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="m-0">Refeições</h5>
                    <div style={{ width: "100%", overflowX: "auto" }}></div>
                      <button onClick={() => setShowModalRefeicao(true)}>
                        +
                      </button>
                  </div>
                <table className="table table-hover mt-3">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refeicoes.length === 0 ? (
                      <tr><td colSpan="3" className="text-center">Nenhuma refeição cadastrada</td></tr>
                    ) : (
                      refeicoes.map((r) => (
                        <tr
                          key={r.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => carregarItensDaRefeicao(r.id)}
                          className={refeicaoSelecionada === r.id ? "table-primary" : ""}
                        >
                          <td>{r.descricao}</td>
                          <td>{r.hora_inicial}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            )}
          </div>
        </div>
        <div className="col-md-6">
          {/* Abas do painel */}
          <div className="d-flex gap-2 mb-3">
            <button
              className={`btn ${abaPainel === "planos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setAbaPainel("planos")}
            >
              Cardápio
            </button>
            <button
              className={`btn ${abaPainel === "ia" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setAbaPainel("ia")}
            >
              IA
            </button>
          </div>

          {abaPainel === "planos" && (
            <>
              <h5>Itens</h5>
              {!refeicaoSelecionada && <p>Selecione uma refeição ao lado.</p>}

              {refeicaoSelecionada && (
                <div style={{ overflowX: "auto" }}>
                  <div className="d-flex gap-2 mb-2">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setShowModalItem(true)}
                    >
                      + Item
                    </button>
                  </div>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Descrição</th>
                        <th>Qtd</th>
                        <th>Un.</th>
                        {itensRefeicao.nutrientes.map((n, i) => (
                          <th key={i}>{n}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {itensRefeicao.tabela.length === 0 ? (
                        <tr><td colSpan={3 + itensRefeicao.nutrientes.length} className="text-center">Nenhum item encontrado</td></tr>
                      ) : (
                        itensRefeicao.tabela.map((i, idx) => (
                          <tr key={idx}>
                            <td onClick={() => setCelulaEditando({ linha: idx, campo: "descricao" })}>
                              {celulaEditando?.linha === idx && celulaEditando?.campo === "descricao" ? (
                                <input
                                  type="text"
                                  value={i.descricao}
                                  onChange={(e) => {
                                    const novos = [...itensRefeicao.tabela];
                                    novos[idx].descricao = e.target.value;
                                    setItensRefeicao({ ...itensRefeicao, tabela: novos });
                                  }}
                                  onBlur={() => salvarEdicao(itensRefeicao.tabela[idx], "descricao")}
                                  autoFocus
                                  className="form-control form-control-sm"
                                />
                              ) : (
                                i.descricao
                              )}
                            </td>
                            <td onClick={() => setCelulaEditando({ linha: idx, campo: "quantidade" })}>
                              {celulaEditando?.linha === idx && celulaEditando?.campo === "quantidade" ? (
                                <input
                                  type="text"
                                  value={i.quantidade}
                                  onChange={(e) => {
                                    const novos = [...itensRefeicao.tabela];
                                    novos[idx].quantidade = e.target.value;
                                    setItensRefeicao({ ...itensRefeicao, tabela: novos });
                                  }}
                                  onBlur={() => salvarEdicao(itensRefeicao.tabela[idx], "quantidade")}
                                  autoFocus
                                  className="form-control form-control-sm"
                                />
                              ) : (
                                i.quantidade
                              )}
                            </td>
                            <td onClick={() => setCelulaEditando({ linha: idx, campo: "unidade_medida" })}>
                              {celulaEditando?.linha === idx && celulaEditando?.campo === "unidade_medida" ? (
                                <input
                                  type="text"
                                  value={i.unidade_medida}
                                  onChange={(e) => {
                                    const novos = [...itensRefeicao.tabela];
                                    novos[idx].unidade_medida = e.target.value;
                                    setItensRefeicao({ ...itensRefeicao, tabela: novos });
                                  }}
                                  onBlur={() => salvarEdicao(itensRefeicao.tabela[idx], "unidade_medida")}
                                  autoFocus
                                  className="form-control form-control-sm"
                                />
                              ) : (
                                i.unidade_medida
                              )}
                            </td>
                            {itensRefeicao.nutrientes.map((n, ni) => (
                              <td onClick={() => setCelulaEditando({ linha: idx, campo: n })}>
                                {celulaEditando?.linha === idx && celulaEditando?.campo === n ? (
                                  <input
                                    type="number"
                                    step="any"
                                    value={i[n] || ""}
                                    onChange={(e) => {
                                      const novos = [...itensRefeicao.tabela];
                                      novos[idx][n] = e.target.value;
                                      setItensRefeicao({ ...itensRefeicao, tabela: novos });
                                    }}
                                    onBlur={() => salvarEdicao(itensRefeicao.tabela[idx], n)}
                                    autoFocus
                                    className="form-control form-control-sm"
                                  />
                                ) : (
                                  i[n] ?? "-"
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {abaPainel === "ia" && (
            <>
              <h5>Chat com IA</h5>
                <div className="border rounded p-2 mb-2 bg-light" style={{ height: "250px", overflowY: "auto" }}>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`mb-2 ${msg.role === "user" ? "text-end" : "text-start"}`}
                    >
                      <span
                        className={`badge bg-${
                          msg.role === "user" ? "primary" : "secondary"
                        }`}
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          textAlign: msg.role === "user" ? "right" : "left",
                          display: "block",
                        }}
                      >
                        {msg.text}
                      </span>
                    </div>
                  ))}
                  {loading && <div className="text-center text-muted">⏳ IA pensando...</div>}
                </div>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Digite sua mensagem..."
                  value={inputChat}
                  onChange={(e) => setInputChat(e.target.value)}
                />
                <button className="btn btn-primary" onClick={enviarMensagem} disabled={loading}>
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {showModalPlano && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            width: 350,
            boxShadow: "0 0 10px rgba(0,0,0,0.3)"
          }}>
            <h3>Novo Plano Alimentar</h3>

            <label>Descrição:</label>
            <input
              type="text"
              value={descricaoPlano}
              onChange={e => setDescricaoPlano(e.target.value)}
              placeholder="ex: Plano de emagrecimento"
              style={{ width: "100%", marginBottom: 10 }}
            />

            <button onClick={salvarPlano} style={{ marginRight: 10 }}>
              Salvar
            </button>

            <button onClick={() => setShowModalPlano(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showModalRefeicao && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            width: 400,
            boxShadow: "0 0 10px rgba(0,0,0,0.3)"
          }}>
            <h4>Nova Refeição</h4>

            <label className="form-label mt-2">Descrição</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Café da manhã"
              value={novaRefeicao.descrição}
              onChange={e => setNovaRefeicao({ ...novaRefeicao, descrição: e.target.value })}
            />

            <div className="row mt-2">
              <div className="col">
                <label className="form-label">Horário</label>
                <input
                  type="time"
                  className="form-control"
                  value={novaRefeicao.horario}
                  onChange={e => setNovaRefeicao({ ...novaRefeicao, horario: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-3 text-end">
              <button
                className="btn btn-primary me-2"
                onClick={async () => {
                  if (!novaRefeicao.descrição || !novaRefeicao.horario) {
                    alert("Preencha todos os campos!");
                    return;
                  }

                  try {
                    const res = await fetch(`${API_BASE}?action=salvar_refeicao`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        plano_id: planoSelecionado,
                        descricao: novaRefeicao.descrição,
                        horario: novaRefeicao.horario
                      })
                    });

                    alert("Refeição cadastrada!");
                    setShowModalRefeicao(false);
                    setNovaRefeicao({ descrição: "", horario: "" });
                    carregarRefeicoesDoPlano(planoSelecionado);
                  } catch (err) {
                    console.error(err);
                    alert("Erro de conexão com o servidor.");
                  }
                }}
              >
                Salvar
              </button>

              <button className="btn btn-secondary" onClick={() => setShowModalRefeicao(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalItem && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}>
          <div className="modal-content bg-white p-3 rounded shadow" style={{ width: 400 }}>
            <h5>Novo Item</h5>

            {/* Campos principais */}
            <div className="mb-2">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Arroz cozido"
                value={novoItem.descricao || ""}
                onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
              />
            </div>

            <div className="row mb-2">
              <div className="col-6">
                <label className="form-label">Quantidade</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="100"
                  value={novoItem.quantidade || ""}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Unidade</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="g, ml..."
                  value={novoItem.unidade_medida || ""}
                  onChange={(e) => setNovoItem({ ...novoItem, unidade_medida: e.target.value })}
                />
              </div>
            </div>

            <hr />
            <h6>Nutrientes</h6>

            {/* Lista dinâmica de nutrientes */}
            {(novoItem.nutrientes || []).map((n, idx) => (
              <div key={idx} className="d-flex gap-2 align-items-center mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nome (ex: Proteína)"
                  value={n.nome}
                  onChange={(e) => {
                    const novos = [...novoItem.nutrientes];
                    novos[idx].nome = e.target.value;
                    setNovoItem({ ...novoItem, nutrientes: novos });
                  }}
                />
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="Qtd"
                  value={n.valor}
                  onChange={(e) => {
                    const novos = [...novoItem.nutrientes];
                    novos[idx].valor = e.target.value;
                    setNovoItem({ ...novoItem, nutrientes: novos });
                  }}
                />
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    const novos = novoItem.nutrientes.filter((_, i) => i !== idx);
                    setNovoItem({ ...novoItem, nutrientes: novos });
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="btn btn-sm btn-outline-success mb-3"
              onClick={() => {
                const novos = [...(novoItem.nutrientes || []), { nome: "", valor: "" }];
                setNovoItem({ ...novoItem, nutrientes: novos });
              }}
            >
              + Adicionar Nutriente
            </button>

            <div className="text-end">
              <button
                className="btn btn-primary me-2"
                onClick={async () => {
                  if (!novoItem.descricao || !novoItem.quantidade || !novoItem.unidade_medida) {
                    alert("Preencha todos os campos principais!");
                    return;
                  }

                  try {
                    // 1️⃣ Salva o item da refeição
                    const res = await fetch(`${API_BASE}?action=salvar_item`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        refeicao_id: refeicaoSelecionada,
                        descricao: novoItem.descricao,
                        quantidade: novoItem.quantidade,
                        unidade_medida: novoItem.unidade_medida
                      })
                    });
                    const itemRes = await res.json();

                    // 2️⃣ Se houver nutrientes, salva cada um
                    if (itemRes.ok && novoItem.nutrientes?.length > 0) {
                      for (const nut of novoItem.nutrientes) {
                        await fetch(`${API_BASE}?action=salvar_nutrientes`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            item_refeicao_id: itemRes.id,
                            descricao: nut.nome,
                            quantidade: nut.valor
                          })
                        });
                      }
                    }

                    alert("Item cadastrado com sucesso!");
                    setShowModalItem(false);
                    setNovoItem({ descricao: "", quantidade: "", unidade_medida: "", nutrientes: [] });
                    carregarItensDaRefeicao(refeicaoSelecionada);
                  } catch (err) {
                    console.error(err);
                    alert("Erro de conexão com o servidor.");
                  }
                }}
              >
                Salvar
              </button>

              <button className="btn btn-secondary" onClick={() => setShowModalItem(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AtendimentoDetalhes;
