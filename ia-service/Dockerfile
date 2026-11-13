# Serviço de IA (FastAPI). Sem chave de LLM, responde em modo local.
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
RUN useradd -r -u 1001 app
USER app
EXPOSE 8000
HEALTHCHECK --interval=20s --timeout=3s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/saude')" || exit 1
# A hospedagem pode definir a porta em $PORT (Render, Azure); o padrão é 8000.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
