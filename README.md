# Hub Inteligente de Recursos Educacionais

Projeto fullstack para gerenciamento de materiais didáticos com suporte de IA para sugestão de descrição e tags.

## Stack

- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React + Vite
- IA: Integração com API compatível com OpenAI (`mock` por padrão)

## Funcionalidades implementadas

- CRUD completo de recursos (Título, Descrição, Tipo, URL, Tags)
- Listagem com paginação
- Smart Assist no formulário:
  - Botão "Gerar Descrição com IA"
  - Envia `title` e `resource_type` para o backend
  - Retorna descrição sugerida + 3 tags
  - Preenchimento automático no frontend
- Feedback visual de loading no processamento da IA
- Tratamento de erro no frontend e backend
- Endpoint de health check: `/health`
- Logs estruturados da interação de IA (latência, modo, token usage)
- Pipeline CI com lint backend e build frontend

## Estrutura

```bash
.
├── backend
│   ├── app
│   │   ├── core
│   │   ├── routers
│   │   ├── ai_service.py
│   │   ├── db.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   └── requirements.txt
├── frontend
│   ├── src
│   └── package.json
└── .github/workflows/ci.yml
```

## Como rodar

### 1) Backend

```bash
cd backend
cp .env.example .env
python3 -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API disponível em `http://localhost:8000`

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend disponível em `http://localhost:5173`

## Smart Assist (IA)

No arquivo `backend/.env`:

- `AI_MODE=mock` usa fallback simulado (com latência artificial)
- `AI_MODE=live` usa chamada real da API

Para modo `live`, configurar:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

## Endpoints principais

- `GET /health`
- `GET /resources?page=1&page_size=10`
- `GET /resources/{id}`
- `POST /resources`
- `PUT /resources/{id}`
- `DELETE /resources/{id}`
- `POST /assist`

Exemplo de payload para `POST /assist`:

```json
{
  "title": "Matemática Financeira",
  "resource_type": "PDF"
}
```
