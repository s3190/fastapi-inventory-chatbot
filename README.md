# FastAPI Inventory Chatbot

A full-stack inventory management application built with FastAPI, React, PostgreSQL, and SQLAlchemy.  
This project includes CRUD operations for products and a chatbot interface that answers inventory-related questions.

## Features
- Add, edit, delete, and view products
- Search and sort products
- Inventory chatbot for:
  - cheapest product
  - most expensive item
  - lowest stock
  - product price lookup
  - stock availability

## Tech Stack
- FastAPI
- React.js
- PostgreSQL
- SQLAlchemy
- Axios
- OpenAI API with fallback logic

## Run Locally

### Backend
```bash
uvicorn main:app --reload --port 8001
