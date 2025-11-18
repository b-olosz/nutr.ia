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

    // print_r($stmt);exit;
    Response::json(['ok' => true, 'id' => $pdo->lastInsertId()]);
  }
}
