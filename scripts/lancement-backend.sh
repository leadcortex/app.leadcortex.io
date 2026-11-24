# scripts/lancement-backend.sh

cd backend/academy
go run ./cmd/academy-server -env development -addr :8080 -content content