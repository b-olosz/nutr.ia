<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/Response.php';

class AtendimentosController {
  public static function listar_atendimentos() {
    global $pdo;
    $stmt = $pdo->query("
      SELECT a.*, p.nome AS paciente_nome 
      FROM atendimentos a 
      JOIN pessoas p ON p.id = a.paciente_id
      ORDER BY a.data_criacao DESC
    ");
    Response::json($stmt->fetchAll());
  }

  public static function cadastrar_atendimentos($data) {
    global $pdo;
    $stmt = $pdo->prepare("
      INSERT INTO atendimentos (paciente_id, usuario_id, descricao)
      VALUES (?, ?, ?)
    ");
    $stmt->execute([
      $data['paciente_id'] ?? null,
      $data['usuario_id'] ?? null,
      $data['descricao'] ?? null
    ]);
    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function salvar_plano($data) {
    global $pdo;
    $stmt = $pdo->prepare("
      INSERT INTO planos_alimentares (atendimento_id, descricao, ativo)
      VALUES (?, ?, 1)
    ");
    $stmt->execute([
      $data['atendimento_id'] ?? null,
      $data['descricao'] ?? null
    ]);
    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function listar_planos($id) {
    global $pdo;

    $stmt = $pdo->prepare("SELECT * FROM planos_alimentares WHERE atendimento_id = ?");
    $stmt->execute([$id]);

    Response::json($stmt->fetchAll());
  }

  public static function listar_refeicoes($id) {
    global $pdo;

    $stmt = $pdo->prepare("SELECT * FROM refeicoes WHERE plano_id = ?");
    $stmt->execute([$id]);

    Response::json($stmt->fetchAll());
  }

  public static function salvar_refeicao($data) {
    global $pdo;
    $stmt = $pdo->prepare("
      INSERT INTO refeicoes (plano_id, descricao, hora_inicial)
      VALUES (?, ?, ?)
    ");
    $stmt->execute([
      $data['plano_id'] ?? null,
      $data['descricao'] ?? null,
      $data['horario'] ?? null
    ]);
    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function salvar_refeicao_ia($data) {
    global $pdo;

    $stmt = $pdo->prepare("SELECT * FROM refeicoes WHERE plano_id = ? and descricao LIKE ?");
    $stmt->execute([
      $data['plano_id'],
      $data['descricao'],
    ]);

    $response = $stmt->fetchAll();

    if(empty($response)){
      $stmt = $pdo->prepare("
        INSERT INTO refeicoes (plano_id, descricao, hora_inicial)
        VALUES (?, ?, ?)
      ");
      $stmt->execute([
        $data['plano_id'] ?? null,
        $data['descricao'] ?? null,
        $data['horario'] ?? null
      ]);
    }

    print_r($response);
    // exit;

    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function listar_itens($id) {
    global $pdo;

    $stmt = $pdo->prepare("SELECT itens_refeicao.id, itens_refeicao.descricao, itens_refeicao.quantidade, itens_refeicao.unidade_medida, 
                            valores_nutricionais.descricao nome_nutriente, valores_nutricionais.quantidade qtde_nutri
                           FROM itens_refeicao 
                           LEFT JOIN valores_nutricionais ON valores_nutricionais.item_refeicao_id = itens_refeicao.id
                           WHERE itens_refeicao.refeicao_id = ?");
                           
    $stmt->execute([$id]);

    Response::json($stmt->fetchAll());
  }

  // public static function valores_nutri_refeicao($id) {
  //   global $pdo;

  //   $stmt = $pdo->prepare("SELECT DISTINCT valores_nutricionais.descricao
  //                          FROM valores_nutricionais 
  //                          LEFT JOIN itens_refeicao ON valores_nutricionais.item_refeicao_id = itens_refeicao.id
  //                          WHERE itens_refeicao.refeicao_id = ?");

  //   $stmt->execute([$id]);

  //   Response::json($stmt->fetchAll());
  // }

  public static function salvar_item($data) {
    global $pdo;
    $stmt = $pdo->prepare("
      INSERT INTO itens_refeicao (refeicao_id, descricao, unidade_medida, quantidade)
      VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
      $data['refeicao_id'] ?? null,
      $data['descricao'] ?? null,
      $data['unidade_medida'] ?? null,
      $data['quantidade'] ?? null
    ]);
    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function salvar_nutrientes($data) {
    global $pdo;
    $stmt = $pdo->prepare("
      INSERT INTO valores_nutricionais (item_refeicao_id, descricao, quantidade)
      VALUES (?, ?, ?)
    ");
    $stmt->execute([
      $data['item_refeicao_id'] ?? null,
      $data['descricao'] ?? null,
      $data['quantidade'] ?? null
    ]);
    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function atualizar_item($data) {
    global $pdo;

    $campo = $data['campo'];
    $valor = $data['valor'];

    $stmt = $pdo->prepare("
      UPDATE itens_refeicoes SET {$campo} = ? WHERE ID = ?
    ");

    $stmt->execute([
      $valor ?? null,
      $data['id'] ?? null,
    ]);
    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function listar_historico($atendimento_id) {
    global $pdo;
  
    $stmt = $pdo->prepare("SELECT * FROM historico_chat WHERE atendimento_id = ? ORDER BY id ASC");
    $stmt->execute([$atendimento_id]);

    Response::json($stmt->fetchAll());
  }
}
