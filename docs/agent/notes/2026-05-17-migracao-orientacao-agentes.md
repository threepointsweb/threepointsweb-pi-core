# 2026-05-17 — migração da orientação de execução de agentes

## Objetivo

Comparar `agents/AGENTS.md` com `../pi-extension-prisema/agents/AGENTS.md`, identificar conteúdo perdido e migrar o que for relevante para a orientação de execução ThreePointsWeb.

## Contexto

- `agents/AGENTS.md` é injetado pelo `threepointsweb-core` via `before_agent_start`, então precisa ser genérico, público e reutilizável.
- Antes da migração, o arquivo local tinha apenas as seções de roteamento de skills e de objetivos/Sisyphus.
- O arquivo de referência tinha uma base operacional completa para execução, pesquisa, subagentes, ferramentas, validação, notas, evolução, recorrência e git.
- A migração precisava preservar a intenção dessas regras sem copiar conteúdo privado, específico do projeto de referência ou incompatível com um pacote público ThreePointsWeb.

## Comparação realizada

### Conteúdo que já existia no `agents/AGENTS.md` local antes da migração

- Roteamento de skills.
- Roteamento de objetivos/Sisyphus.

### Conteúdo presente no arquivo de referência e ausente ou enfraquecido localmente

- Ciclo principal de execução — relevante porque define postura de execução, regras de bloqueio e comportamento padrão.
- Portão de coerência do pedido — relevante porque evita criar ou mover arquivos no projeto errado.
- Saída padrão — relevante porque padroniza o retorno compacto ao usuário.
- Pesquisa primeiro — relevante porque reforça descoberta local, evidência e separação entre fato e suposição.
- Roteamento de subagentes e contratos de instrução — relevante porque o pacote ThreePointsWeb inclui ferramentas de subagentes.
- Portão de design — relevante depois de remover dependências específicas do projeto de referência.
- Roteamento de capacidades e salvaguardas — relevante quando generalizado para web, MCP, mídia, browser, SSH e diagramas.
- Verificação e limpeza — relevante porque obriga validação concreta e limpeza apenas no escopo tocado.
- Notas e utilitários — relevante porque combina com a regra local de registrar tarefas não triviais em `docs/agent/notes/`.
- Artefatos de auto-evolução — relevante porque captura melhorias reutilizáveis para o ecossistema ThreePointsWeb.
- Índice de recorrência — relevante como padrão opcional quando o projeto adotar esse mecanismo.
- Regras de Git — relevante depois de tornar commit/push mais seguro e menos específico do arquivo de referência.
- Definição de pronto — relevante porque fecha o trabalho com evidências, nota, reuso, risco e reversão.

## Proposta de migração aplicada

| Grupo | Decisão | Justificativa |
|---|---|---|
| Comportamento operacional principal | Migrado e adaptado | É genérico e útil em sessões Pi com ThreePointsWeb. |
| Roteamento de skills | Preservado e melhorado | Mantém as ferramentas ThreePointsWeb de skills, mas não bloqueia se elas estiverem indisponíveis. |
| Roteamento de objetivos/Sisyphus | Preservado | A regra recém-adicionada continua importante para tarefas de múltiplas ações. |
| Roteamento de subagentes | Migrado e adaptado | O pacote ThreePointsWeb inclui orquestração de subagentes. |
| Pesquisa, validação e limpeza | Migradas e adaptadas | Aumentam confiabilidade sem depender de detalhes do arquivo de referência. |
| Browser, visual, remoto e ferramentas externas | Migrados em forma generalizada | Referências específicas foram removidas e as salvaguardas úteis foram mantidas. |
| Trechos específicos do arquivo de referência, nomes de projetos/empresas, variáveis de ambiente e comandos próprios | Não migrados | São específicos demais ou privados para uma orientação pública de execução ThreePointsWeb. |
| Notas, auto-evolução e recorrência | Migradas e adaptadas | Combinam com o comportamento reutilizável esperado deste pacote. |
| Regras de Git | Migradas com redação mais conservadora | Push e commit ficaram condicionados a aprovação explícita ou permissão local clara. |

## Decisões

- Reescrevi `agents/AGENTS.md` como uma orientação completa de execução ThreePointsWeb em vez de copiar o arquivo de referência literalmente.
- Removi referências explícitas a projetos/empresas específicos, variáveis de ambiente do arquivo de referência, comandos particulares e suposições que não pertencem a este pacote.
- Mantive nomes de ferramentas e agentes que fazem parte do Pi/ThreePointsWeb quando necessário: `threepointsweb_skill_search`, `threepointsweb_skill_load`, `Agent`, `Explore`, `Implement`, `Review` e `Remove Slop`.
- Adicionei alternativa para ferramentas indisponíveis, evitando que a orientação injetada crie bloqueios em perfis mais enxutos.
- Tornei explícitas as restrições de segurança, privacidade e publicação porque este pacote é destinado a distribuição.
- Após a auditoria rejeitar a primeira conclusão, traduzi a nota e os títulos/contratos principais de `agents/AGENTS.md` para cumprir a restrição de trabalhar em português.

## Comandos executados

- Leitura de `agents/AGENTS.md`.
- Leitura de `../pi-extension-prisema/agents/AGENTS.md`.
- Extração dos títulos dos dois arquivos com script Node via `ctx_execute`.
- Leitura de `README.md` e `extensions/threepointsweb-core.ts` para confirmar o contexto de injeção do arquivo.
- Varredura final dos títulos e de termos específicos que não deveriam ser migrados.
- Execução de `npm pack --dry-run --json`, confirmando que `agents/AGENTS.md` entra no pacote.

## Arquivos alterados

- `agents/AGENTS.md`
- `docs/agent/notes/2026-05-17-migracao-orientacao-agentes.md`

## Testes / validação

- A varredura de títulos confirmou que `agents/AGENTS.md` contém uma orientação completa com 25 títulos/seções.
- A varredura de termos específicos não encontrou, no arquivo final de execução, referências particulares do arquivo de referência que deveriam ficar fora do pacote ThreePointsWeb.
- `npm pack --dry-run --json` passou.
- A simulação de empacotamento confirmou que `agents/AGENTS.md` é incluído em `threepointsweb-pi-core-0.2.0.tgz`.

## Riscos

- A orientação de execução ficou substancialmente maior; se o tamanho das instruções injetadas virar problema, uma próxima melhoria pode separar partes avançadas em skills/playbooks sob demanda.
- Algumas regras citam ferramentas/subagentes opcionais; por isso a redação inclui alternativa para não bloquear quando algo não estiver disponível.
- A tradução para português melhora aderência à tarefa atual, mas alguns nomes próprios de ferramentas permanecem em inglês porque são identificadores reais do ecossistema Pi/ThreePointsWeb.

## Reversão

- Restaurar o `agents/AGENTS.md` anterior pelo git ou substituir o arquivo apenas pelas seções de roteamento de skills e objetivos/Sisyphus.

## Próximo passo

- Testar o pacote em uma sessão Pi real para confirmar que a orientação de execução injetada aparece como esperado e não conflita com `AGENTS.md` local de projetos consumidores.
