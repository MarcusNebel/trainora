#!/bin/sh

# Starte Ollama im Hintergrund zum Pullen
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

# Warte, bis Port erreichbar ist
until curl -s http://localhost:11434/api/tags > /dev/null; do
  echo "Warte auf Ollama..."
  sleep 1
done

# Modell laden (nur wenn noch nicht vorhanden)
if ! ollama list | grep -q llama3; then
  echo "Lade Modell llama3..."
  ollama pull llama3
fi

# Hintergrund-Ollama beenden
kill $OLLAMA_PID
wait $OLLAMA_PID 2>/dev/null

# Jetzt Ollama im Vordergrund starten
exec ollama serve
