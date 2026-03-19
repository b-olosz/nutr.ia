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

  public static function salvar_item_process($data) {
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

    return $pdo->lastInsertId();
  }
  
  public static function salvar_item($data) {
    $id = AtendimentosController::salvar_item_process($data);

    Response::json(['ok' => true, 'id' => $id]);
  }

  public static function salvar_refeicao_ia($data) {
    global $pdo;

    $refeicao_id = null;

    $stmt = $pdo->prepare("SELECT * FROM refeicoes WHERE plano_id = ? and descricao LIKE ?");
    $stmt->execute([
      $data['plano_id'],
      $data['descricao'],
    ]);

    $response = $stmt->fetchAll();
    // print_r($response);

    if(isset($response[0]['id'])){
      $refeicao_id = $response[0]['id'];

      $stmt = $pdo->prepare("
        DELETE FROM valores_nutricionais WHERE item_refeicao_id = ?
      ");
      $stmt->execute([$refeicao_id]);
      $stmt = $pdo->prepare("
        DELETE FROM itens_refeicao WHERE id = ?
      ");
      $stmt->execute([$refeicao_id]);
    }
    else{
      $stmt = $pdo->prepare("
        INSERT INTO refeicoes (plano_id, descricao, hora_inicial)
        VALUES (?, ?, ?)
      ");
      $stmt->execute([
        $data['plano_id'] ?? null,
        $data['descricao'] ?? null,
        $data['horario'] ?? null
      ]);

      $refeicao_id = $pdo->lastInsertId();
    }

    if($refeicao_id){
      foreach($data['itens'] as $item){
        AtendimentosController::salvar_item_process([
          'refeicao_id' => $refeicao_id,
          'descricao' => $item['descricao'],
          'unidade_medida' => $item['unidade_medida'],
          'quantidade' => $item['quantidade']
        ]);
      }
    }
    
    Response::json(['ok' => true]);
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
  
    $stmt = $pdo->prepare("SELECT role, mensagem text, data_criacao timestamp FROM historico_chat WHERE atendimento_id = ? ORDER BY data_criacao ASC");
    $stmt->execute([$atendimento_id]);


    $results = $stmt->fetchAll();

    foreach($results as &$res){
      if($res['role'] == "assistant"){
        $msg = json_decode($res['text'], true);
        // print_r($msg);exit;
        $res['text'] = $msg['resposta_textual'];
      }
    }

    Response::json($results);
  }
}
