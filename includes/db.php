<?php
session_start();

$hostname = 'localhost';
$username = 'root';
$password = '';
$database = 'TaskSchedulingSys';

$conn = new mysqli($hostname, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$_SESSION['database_connected'] = true; 
?>
