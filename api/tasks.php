<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__.'/../includes/db.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            if (isset($_GET['task_id'])) {
                $task_id = $_GET['task_id'];
                $query = "SELECT * FROM Tasks WHERE task_id = ?";
                $statement = $conn->prepare($query);

                if (!$statement) throw new Exception("Database error: " . $conn->error);

                $statement->bind_param('i', $task_id);
                $statement->execute();
                $result = $statement->get_result();
                $task = $result->fetch_assoc();

                echo json_encode($task ?: ['message' => 'Task not found']);
            } else if (isset($_GET['users'])) {
                $query = "SELECT * FROM Users";
                $result = $conn->query($query);

                if (!$result) throw new Exception("Database query failed: " . $conn->error);

                echo json_encode($result->fetch_all(MYSQLI_ASSOC));
            } else {
                $query = "SELECT * FROM Tasks";
                $result = $conn->query($query);

                if (!$result) throw new Exception("Database query failed: " . $conn->error);

                echo json_encode($result->fetch_all(MYSQLI_ASSOC));
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $conn->prepare("INSERT INTO Tasks (user_id, task_title, task_description, task_date, status, priority) VALUES (?, ?, ?, ?, ?, ?)");
            if (!$stmt) throw new Exception("Database error: " . $conn->error);

            $stmt->bind_param("isssss", $data['user_id'], $data['task_title'], $data['task_description'], $data['task_date'], $data['status'], $data['priority']);
            $stmt->execute();

            echo json_encode(['message' => $stmt->affected_rows > 0 ? 'Task created successfully' : 'Failed to create task']);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $task_id = $data['task_id'];
            $stmt = $conn->prepare("UPDATE Tasks SET task_title = ?, task_description = ?, task_date = ?, status = ?, priority = ? WHERE task_id = ?");
            if (!$stmt) throw new Exception("Database error: " . $conn->error);

            $stmt->bind_param("sssssi", $data['task_title'], $data['task_description'], $data['task_date'], $data['status'], $data['priority'], $task_id);
            $stmt->execute();

            echo json_encode(['message' => $stmt->affected_rows > 0 ? 'Task updated successfully' : 'Failed to update task']);
            break;

            case 'DELETE':
                $task_id = $_GET['task_id'];
                $query = "DELETE FROM Tasks WHERE task_id = $task_id";
                if ($conn->query($query)) {
                    echo json_encode(['message' => 'Task deleted']);
                } else {
                    http_response_code(500);
                    echo json_encode(['message' => 'Failed to delete tasks', 'error' => $conn->error]);
                }
            break;

        case 'PATCH':
            if (!isset($_GET['task_id'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Task ID is required']);
                exit;
            }
        
            $task_id = $_GET['task_id'];
            $data = json_decode(file_get_contents('php://input'), true);
        
            if (!isset($data['status'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Status is required']);
                exit;
            }
        
            $status = $data['status'];
        
            $stmt = $conn->prepare("UPDATE Tasks SET status = ? WHERE task_id = ?");
            if (!$stmt) throw new Exception("Database error: " . $conn->error);
        
            $stmt->bind_param("si", $status, $task_id);
            $stmt->execute();
        
            echo json_encode(['message' => $stmt->affected_rows > 0 ? 'Task updated successfully' : 'No changes made']);
            break;
        

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
