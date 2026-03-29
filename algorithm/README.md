# Algorithm Service

## Requirements

Python 3.10+

## Install

pip install -r requirements.txt

## Run

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

## Test endpoints

- GET /health
- POST /infer
