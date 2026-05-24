#!/bin/bash
echo "🔍 WayaCloud — Vérification sécurité en cours..."

# Vérifier qu'aucun .env n'est commité
if git ls-files | grep -i "^\.env"; then
  echo "❌ ERREUR : Fichier .env détecté dans le repo Git !"
  exit 1
fi

# Vérifier qu'aucune clé Anthropic n'est dans le code
if grep -r "sk-ant" --include="*.ts" . | grep -v node_modules | grep -v ".example"; then
  echo "❌ ERREUR : Clé API Anthropic détectée dans le code !"
  exit 1
fi

# Vérifier qu'aucun JWT hardcodé
if grep -r "eyJ" --include="*.ts" . | grep -v node_modules | grep -v ".example"; then
  echo "❌ ERREUR : Token JWT détecté dans le code !"
  exit 1
fi

# Vérifier qu'on n'utilise pas Math.random() pour les tokens
if grep -r "Math.random" lib/ --include="*.ts" 2>/dev/null; then
  echo "⚠️  ATTENTION : Math.random() trouvé dans lib/ — utiliser crypto.randomBytes()"
  exit 1
fi

echo "✅ Vérification sécurité réussie — Aucune fuite détectée."
