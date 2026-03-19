<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/Response.php';

class PacientesController {
  public static function listar_pacientes() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM pessoas ORDER BY nome");
    Response::json($stmt->fetchAll());
  }

  public static function cadastrar_pacientes($data) {
    global $pdo;

    $stmt = $pdo->prepare("INSERT INTO pessoas (nome, email, cpf, data_nascimento) VALUES (?, ?, ?, ?)");
    $stmt->execute([
      $data['nome'] ?? null,
      $data['email'] ?? null,
      $data['cpf'] ?? null,
      $data['data_nascimento'] ?? null
    ]);

    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function atualizar_paciente($data) {
    global $pdo;

    // Verificação básica
    if (empty($data['id'])) {
        Response::json(['ok' => false, 'erro' => 'ID do paciente não informado']);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE pessoas SET
            nome = ?,
            email = ?,
            cpf = ?,
            alergias = ?,
            restricoes = ?,
            condicoes_medicas = ?,
            objetivos = ?
        WHERE id = ?
    ");

    $ok = $stmt->execute([
        $data['nome'] ?? null,
        $data['email'] ?? null,
        $data['cpf'] ?? null,
        // $data['data_nascimento'] ?? null,
        $data['alergias'] ?? null,
        $data['restricoes'] ?? null,
        $data['condicoes_medicas'] ?? null,
        $data['objetivos'] ?? null,
        $data['id']
    ]);

    if ($ok) {
        Response::json(['ok' => true]);
    } else {
        Response::json(['ok' => false, 'erro' => 'Erro ao atualizar paciente']);
    }
  }

  public static function cadastrar_biometria($data) {
    global $pdo;

    $stmt = $pdo->prepare("
        INSERT INTO historico_biometrico 
        (pessoa_id, peso, altura, data_medicao, 
        cintura, quadril, braco, coxa, pescoco,
        percentual_gordura, percentual_massa)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $data['paciente_id'],
        $data['peso'],
        $data['altura'],
        $data['data'],
        $data['cintura'],
        $data['quadril'],
        $data['braco'],
        $data['coxa'],
        $data['pescoco'],
        $data['percentual_gordura'],
        $data['percentual_massa']
    ]);

    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }

  public static function listar_historico_biometrico($pessoa_id) {
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT 
            id,
            pessoa_id,
            peso,
            altura,
            data_medicao,
            cintura,
            quadril,
            braco,
            coxa,
            pescoco,
            percentual_gordura,
            percentual_massa
        FROM historico_biometrico
        WHERE pessoa_id = ?
        ORDER BY data_medicao DESC
    ");

    $stmt->execute([$pessoa_id]);
    $dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Adicionar cálculos (IMC e RCQ)
    foreach ($dados as &$row) {

        // IMC = peso / altura²
        if (!empty($row['altura']) && $row['altura'] > 0) {
            $altura_m = $row['altura'] / 100;
            $row['imc'] = round($row['peso'] / ($altura_m * $altura_m), 2);
        } else {
            $row['imc'] = null;
        }

        // RCQ = cintura / quadril
        if (!empty($row['quadril']) && $row['quadril'] > 0) {
            $row['rcq'] = round($row['cintura'] / $row['quadril'], 2);
        } else {
            $row['rcq'] = null;
        }
    }

    Response::json($dados);
  }
}
