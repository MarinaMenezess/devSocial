# ✅ Tarefas

## 1. Melhorias de Design e UX (Experiência do Usuário)

- [x] **Estilização Geral:** Refatorar os estilos (`StyleSheet`) para criar um tema visual coeso e atraente para todo o aplicativo, considerando cores, fontes, espaçamento e sombras.
- [x] **Componentização:** Transformar partes da UI que se repetem (como cards de posts e botões de interação) em componentes reutilizáveis para organizar melhor o código.
- [x] **Responsividade:** Otimizar a interface para diferentes tamanhos de tela (desktop, tablet, celular) usando `Dimensions` ou flexbox de forma mais avançada.
- [ ] **Feedback Visual — Botão "Favoritar":** Alterar a cor ou ícone ao clicar.
- [ ] **Feedback Visual — Loading:** Adicionar estados de loading mais visuais para requisições de rede.

---

## 2. Implementação de Funcionalidades Adicionais

- [x] **Visualização de Posts Favoritados no Perfil:** Customizar a exibição dos posts na aba "Favoritos" (os dados já vêm do backend).
- [ ] **Remoção de Fotos:** Adicionar opção na tela de edição para remover a foto de perfil existente.  
  - [ ] Para posts: permitir exclusão ou edição de posts criados pelo usuário.
- [ ] **Paginação de Posts:** Implementar paginação (infinite scroll ou botões "Anterior/Próximo") para evitar carregamento lento quando houver muitos posts.
- [ ] **Edição/Exclusão de Posts:** Permitir que o usuário edite ou exclua seus próprios posts.
- [ ] **Edição/Exclusão de Comentários:** Permitir que o usuário edite ou exclua seus próprios comentários.  
  _(Requer novas rotas e lógica no backend)_

---

## 3. Correção e Otimização

- [x] **Bug do Logout:** Corrigir o problema do botão "Sair" na `HomeScreen` que não redireciona para a tela de login.  
- [ ] **Gerenciamento de Erros:** Melhorar a exibição de mensagens de erro, tornando-as mais amigáveis e informativas.
- [ ] **Refatoração do Código:** Otimizar a lógica de requisições de API para evitar repetição, como a obtenção do `userToken` em múltiplas funções.

---

## 📦 Entrega

- Criar um repositório para o projeto.
- Enviar junto com a atividade no Teams.
- **Incluir um vídeo** do projeto funcionando e demonstrando o fluxo de uso.
