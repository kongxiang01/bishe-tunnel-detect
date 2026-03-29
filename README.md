# Tunnel MVP Project

Graduation-project-oriented MVP scaffold with three layers:

- frontend: React + Vite dashboard shell
- backend: Spring Boot REST service
- algorithm: FastAPI inference service (stub)

## Structure

- frontend
- backend
- algorithm

## Quick start

1. Start algorithm service

	cd algorithm
	pip install -r requirements.txt
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

2. Start backend service

	cd backend
	mvn spring-boot:run

3. Start frontend service

	cd frontend
	npm install
	npm run dev

## Default URLs

- frontend: http://localhost:5173
- backend: http://localhost:8080
- algorithm: http://localhost:8000

## Current MVP state

- Backend returns demo events in memory.
- Algorithm returns stub inference output.
- You can replace stubs step by step with real model and database logic.
