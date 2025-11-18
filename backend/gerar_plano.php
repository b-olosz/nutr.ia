<?php
require 'vendor/autoload.php';
require_once __DIR__ . '/config/db.php'; // <-- conexão PDO ($pdo)

use Google\Auth\Credentials\ServiceAccountCredentials;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// === CONFIGURAÇÃO ===
$serviceAccountPath = __DIR__ . '/service_account.json';
$scopes = ['https://www.googleapis.com/auth/generative-language'];
$creds = new ServiceAccountCredentials($scopes, $serviceAccountPath);
$accessToken = $creds->fetchAuthToken()['access_token'] ?? null;

if (!$accessToken) {
  echo json_encode(["erro" => "Não foi possível gerar access token"]);
  exit;
}

// === ENTRADA ===
$input = json_decode(file_get_contents("php://input"), true);
$atendimento_id = $input["atendimento_id"] ?? null;
$paciente = $input["paciente"] ?? "Paciente";
$mensagem = $input["mensagem"] ?? "";

// === SALVAR mensagem do usuário ===
if ($atendimento_id && $mensagem) {
  $stmt = $pdo->prepare("INSERT INTO historico_chat (atendimento_id, role, mensagem) VALUES (?, 'user', ?)");
  $stmt->execute([$atendimento_id, $mensagem]);
}

// === BUSCAR contexto (refeições atuais) ===
$contexto = [];
if ($atendimento_id) {
  $sql = "SELECT r.id AS refeicao_id, r.descricao AS nome_refeicao, r.hora_inicial, r.hora_final,
                 i.descricao, i.quantidade, i.unidade_medida
          FROM refeicoes r
          LEFT JOIN itens_refeicao i ON i.refeicao_id = r.id
          LEFT JOIN planos_alimentares p ON p.id = r.plano_id
          WHERE p.atendimento_id = ?
          ORDER BY p.data_criacao, r.hora_inicial";
  $stmt = $pdo->prepare($sql);
  $stmt->execute([$atendimento_id]);
  $contexto = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// === BUSCAR histórico anterior ===
$historico = [];
if ($atendimento_id) {
  $stmt = $pdo->prepare("SELECT role, mensagem FROM historico_chat WHERE atendimento_id = ? ORDER BY id ASC");
  $stmt->execute([$atendimento_id]);
  $historico = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// === MONTA O PROMPT ===
$prompt = "
Você é um nutricionista virtual.

Responda SOMENTE em JSON, no formato:
{
  \"resposta_textual\": \"texto que explica resumidamente a resposta\",
  \"refeicoes\": [
    {
      \"nome\": \"Nome da refeição (café da manhã, janta, etc\",
      \"horario\": \"hh:mm\",
      \"itens\": [
        {\"descricao\": \"Pão integral\", \"quantidade\": 2, \"unidade_medida\": \"fatias\"},
        {\"descricao\": \"Queijo branco\", \"quantidade\": 30, \"unidade_medida\": \"g\"}
      ]
    }
  ]
}

Contexto do plano alimentar (refeições atuais): 
" . json_encode($contexto, JSON_PRETTY_PRINT) . "

Histórico de conversa:
" . json_encode($historico, JSON_PRETTY_PRINT) . "

Nova solicitação: \"$mensagem\"
";

// === CHAMADA À IA ===
$url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent";

$data = [
  "contents" => [
    [
      "role" => "user",
      "parts" => [
        ["text" => $prompt]
      ]
    ]
  ]
];

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "Authorization: Bearer $accessToken"
  ],
  CURLOPT_POSTFIELDS => json_encode($data)
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
  echo json_encode(["erro" => "Erro da API", "codigo" => $httpCode, "resposta" => $response]);
  exit;
}

// === PROCESSAR RESPOSTA ===
$result = json_decode($response, true);
$resposta = $result["candidates"][0]["content"]["parts"][0]["text"] ?? "{}";
$resposta = preg_replace('/^```json\s*|\s*```$/', '', trim($resposta));
// $resposta = json_decode($resposta, true);
$dados = json_decode($resposta, true);
if (json_last_error() !== JSON_ERROR_NONE) {
  echo json_encode(["erro" => "formato inválido", "resposta" => $resposta]);
  exit;
}

// === SALVAR resposta da IA ===
if ($atendimento_id) {
  $stmt = $pdo->prepare("INSERT INTO historico_chat (atendimento_id, role, mensagem) VALUES (?, 'assistant', ?)");
  $stmt->execute([$atendimento_id, $resposta]);
}

// === INSERIR novas refeições (se houver) ===
// if (!empty($dados["refeicoes"])) {
//   foreach ($dados["refeicoes"] as $r) {
//     $stmt = $pdo->prepare("INSERT INTO refeicoes (atendimento_id, item, hora_inicial, hora_final) VALUES (?, ?, ?, ?)");
//     $stmt->execute([$atendimento_id, $r["nome"], $r["hora_inicial"], $r["hora_final"]]);
//     $refeicao_id = $pdo->lastInsertId();

//     if (!empty($r["itens"])) {
//       foreach ($r["itens"] as $i) {
//         $stmt2 = $pdo->prepare("INSERT INTO itens_refeicao (refeicao_id, descricao, quantidade, unidade_medida)
//                                 VALUES (?, ?, ?, ?)");
//         $stmt2->execute([$refeicao_id, $i["descricao"], $i["quantidade"], $i["unidade_medida"]]);
//       }
//     }
//   }
// }

// === RETORNO FINAL ===
echo json_encode([
  "ok" => true,
  "resposta" => $dados["resposta_textual"] ?? "OK",
  "refeicoes" => $dados["refeicoes"] ?? []
]);
