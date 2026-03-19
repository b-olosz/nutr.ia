<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

require_once __DIR__ . '/modules/pacientes.php';
require_once __DIR__ . '/modules/atendimentos.php';
require_once __DIR__ . '/utils/Response.php';

// Captura rota e método
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true) ?? [];

// Roteamento
switch ($action) {
  // Pacientes
  case 'listar_pacientes':
    PacientesController::listar_pacientes();
    break;
  case 'cadastrar_pacientes':
    PacientesController::cadastrar_pacientes($input);
    break;
  case 'atualizar_paciente':
    PacientesController::atualizar_paciente($input);
    break;
  case 'cadastrar_biometria':
    PacientesController::cadastrar_biometria($input);
    break;
  case 'listar_historico_biometrico':
    $id = intval($_GET["paciente_id"]);
    PacientesController::listar_historico_biometrico($id);
    break;

  // Atendimentos
  case 'listar_atendimentos':
    AtendimentosController::listar_atendimentos();
    break;
  case 'cadastrar_atendimentos':
    AtendimentosController::cadastrar_atendimentos($input);
    break;

  case 'listar_planos':
    $id = intval($_GET["atendimento_id"]);
    AtendimentosController::listar_planos($id);
    break;

  case 'salvar_plano':
    AtendimentosController::salvar_plano($input);
    break;

  case 'listar_refeicoes':
    $id = intval($_GET["id_plano"]);
    AtendimentosController::listar_refeicoes($id);
    break;
    
  case 'salvar_refeicao':
    AtendimentosController::salvar_refeicao($input);
    break;

  case 'salvar_refeicao_ia':
    AtendimentosController::salvar_refeicao_ia($input);
    break;

  case 'atualizar_item':
    AtendimentosController::atualizar_item($input);
    break;
    
  case 'listar_itens':
    $id = intval($_GET["refeicao_id"]);
    AtendimentosController::listar_itens($id);
    break;

  case 'salvar_item':
    AtendimentosController::salvar_item($input);
    break;

  case 'salvar_nutrientes':
    AtendimentosController::salvar_nutrientes($input);
    break;

  // IA (mantém seu arquivo separado)
  case 'chat_ia':
    require __DIR__ . '/gerar_plano.php';
    break;

  case 'listar_historico':
    $atendimento_id = $_GET['atendimento_id'];
    AtendimentosController::listar_historico($atendimento_id);
    break;

  default:
    Response::json(["erro" => "Rota não encontrada"], 404);
}
