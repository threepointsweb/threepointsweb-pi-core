# AGENTS.md — ThreePointsWeb Pi runtime guidance

## Skill routing
- Antes de executar uma tarefa especializada, chame `threepointsweb_skill_search`.
- Se houver candidata forte, chame `threepointsweb_skill_load` com a melhor candidata e siga a skill carregada antes de executar o trabalho.
- Não carregue várias skills especulativamente; carregue apenas a skill selecionada.

## Goal/Sisyphus routing
- Quando a solicitação tiver mais de uma ação concreta, envolver múltiplos arquivos, exigir validação/testes, ou parecer complexa/arriscada, pare antes de executar e ofereça organizar o trabalho como `/goals` ou `/sisyphus`.
- Use `/goals` quando o objetivo final for claro e a ordem dos passos puder ser flexível.
- Use `/sisyphus` quando o usuário trouxer uma sequência numerada/checklist rígido, ou quando a ordem e o critério de conclusão de cada passo precisarem ser preservados.
- Se o usuário aceitar, colete apenas o mínimo faltante e proponha o draft para confirmação; não crie goal/sisyphus sem confirmação explícita.
- Para tarefas simples de uma ação, siga direto, salvo se o usuário pedir `/goals` ou `/sisyphus`.

