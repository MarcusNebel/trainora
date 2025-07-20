#!/bin/sh
MODEL_NAME="gemma3:12b"

# 1. Starte temporär Ollama im Hintergrund, damit "pull" funktioniert
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

# 2. Warte, bis der Port wirklich offen ist
until curl -s http://localhost:11434/api/tags > /dev/null; do
  echo "⏳ Warte auf Ollama-API..."
  sleep 1
done

# 3. Lade Modell, falls nicht vorhanden
if ! ollama list | grep -q "$MODEL_NAME"; then
  echo "📥 Modell $MODEL_NAME nicht gefunden. Lade herunter..."
  ollama pull "$MODEL_NAME"
fi

# 4. Stoppe temporären Ollama-Server
kill $OLLAMA_PID
wait $OLLAMA_PID 2>/dev/null

# 5. Starte Ollama-Server im Vordergrund
echo "🚀 Starte finalen Ollama-Server..."
exec ollama serve
