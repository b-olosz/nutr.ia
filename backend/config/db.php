<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = "127.0.0.1"; // ou "localhost"
$user = "root"; // padrão do XAMPP
$pass = ""; // vazio por padrão no XAMPP
$dbname = "nutr.ia"; // nome do banco que você criou

// try {
//     $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
//     echo "Conectado com sucesso!";
// } catch (PDOException $e) {
//     echo "Erro: " . $e->getMessage();
// }
// exit;

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro de conexão com o banco: " . $e->getMessage()]);
    exit;
}
?>
