#!/bin/bash

# 🚀 WhatsApp Bot Setup Script
# Executa automaticamente a configuração inicial do projeto

set -e  # Exit on error

echo "================================"
echo "🚀 WhatsApp Bot Setup"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo "🔍 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "👉 Instale Node.js 18+ em https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ necessário (atual: $(node --version))${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# 2. Instalar dependências
echo ""
echo "📦 Instalando dependências..."
if npm install; then
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
else
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

# 3. Configurar .env
echo ""
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env criado${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Configure suas variáveis em .env (opcional)${NC}"
else
    echo "✅ .env já existe"
fi

# 4. Criar diretórios necessários
echo ""
echo "📁 Criando diretórios..."
mkdir -p logs tmp auth_info_baileys
echo -e "${GREEN}✅ Diretórios criados${NC}"

# 5. Validar arquivos JS
echo ""
echo "🔍 Validando sintaxe JavaScript..."
if npx eslint src/**/*.js 2>/dev/null; then
    :
else
    echo -e "${YELLOW}⚠️  ESLint encontrou problemas (não impede execução)${NC}"
fi

# 6. Mensagem final
echo ""
echo "================================"
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo "================================"
echo ""
echo "👉 Para iniciar o bot:"
echo "   ${YELLOW}npm start${NC}           (produção)"
echo "   ${YELLOW}npm run dev${NC}         (desenvolvimento com logs debug)"
echo ""
echo "👉 Primeira execução:"
echo "   1. Escaneie o QR code que aparecerá no terminal"
echo "   2. Acesse WhatsApp → Dispositivos Vinculados → Vincular"
echo ""
echo "👉 Logs:"
echo "   - Console: logs em tempo real"
echo "   - Arquivos: logs/bot-$(date +%Y-%m-%d).log"
echo ""
echo "📚 Documentação:"
echo "   - README.md       → Guia completo"
echo "   - DEVELOPMENT.md  → Guia do desenvolvedor"
echo "   - ARCHITECTURE.md → Diagramas e arquitetura"
echo ""
