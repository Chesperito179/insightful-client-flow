# Client Compass

Boa noite, preciso que crie algo nessa ideia:
SISTEMA DE CONTROLE DE CLIENTES — ESPECIFICAÇÃO BASE

1. OBJETIVO DO SISTEMA

Criar um sistema web profissional para gerenciamento e controle de clientes, permitindo acompanhar clientes, vencimentos, pagamentos, renovações, servidores, aplicativos, custos e resultados financeiros.

O sistema deverá possuir um Dashboard central com informações resumidas e um menu lateral para acesso às diferentes áreas.

O projeto deve ser desenvolvido de forma organizada e escalável, permitindo adicionar novas funcionalidades futuramente sem precisar refazer a estrutura principal.

2. ESTRUTURA PRINCIPAL DO SISTEMA

O sistema terá um menu lateral fixo no lado esquerdo da tela.

Menu inicialmente definido:

Início

Clientes

Financeiro

Renovações

Pagamentos

Relatórios

Configurações

O menu lateral deverá permanecer visualmente organizado e profissional.

A área selecionada deverá ficar destacada para que o usuário saiba em qual seção está.

3. INÍCIO — DASHBOARD

A página "Início" será o Dashboard principal do sistema.

O objetivo é mostrar um resumo completo da situação atual dos clientes e do financeiro.

3.1 Indicadores principais

O Dashboard deverá apresentar cards/resumos com informações como:

Total de clientes

Clientes ativos

Clientes vencidos

Clientes que vencem hoje

Clientes que vencem nos próximos 7 dias

Valor recebido no mês

Valor previsto para receber

Gastos do mês

Lucro estimado

Os números deverão ser calculados automaticamente com base nos dados cadastrados no sistema.

3.2 Alertas importantes

O Dashboard deverá possuir uma área de alertas.

Exemplos:

Clientes vencidos

Clientes próximos do vencimento

Pagamentos pendentes

Outras situações que necessitem de atenção

Exemplo visual:

🔴 5 clientes vencidos

🟡 8 clientes vencem nos próximos 7 dias

💰 R$ 1.250,00 previstos para receber

3.3 Próximas renovações

O Dashboard deverá mostrar uma lista dos clientes próximos de vencer.

Exemplo:

ClienteUsuárioExpiraçãoValorJoão Silvajoao12312/09/2026R$ 30,00Maria Souzamaria45614/09/2026R$ 35,00

Essa área deverá facilitar a identificação de clientes que precisam ser renovados.

3.4 Últimos pagamentos

Mostrar os pagamentos realizados mais recentemente.

Exemplo:

ClienteDataValorStatusJoão Silva10/09/2026R$ 30,00PagoMaria Souza09/09/2026R$ 35,00Pago

4. CLIENTES

A área "Clientes" será responsável pelo gerenciamento dos clientes cadastrados.

A visualização principal deverá ser uma tabela/lista, e não cards individuais.

Os clientes aparecerão um abaixo do outro.

4.1 Estrutura da tabela

A tabela principal deverá possuir exatamente estas colunas:

Nome | Usuário | Data de Expiração | Data do Último Pagamento / Valor | Servidor | Aplicativo

Exemplo:

NomeUsuárioData de ExpiraçãoÚltimo pagamento / ValorServidorAplicativoJoão Silvajoao12320/09/202620/08/2026 — R$ 30Servidor 1XCLOUDMaria Souzamaria45623/09/202623/08/2026 — R$ 35Servidor 2KPlayPedro Santospedro78905/10/202605/09/2026 — R$ 30Servidor 1XCLOUD

5. STATUS DE EXPIRAÇÃO

A data de expiração deverá possuir indicação visual de status.

Exemplo:

🟢 Ativo

🟡 Próximo de vencer

🔴 Vencido

O objetivo é permitir que o usuário identifique rapidamente a situação do cliente sem precisar analisar todas as datas manualmente.

6. PESQUISA E FILTROS DE CLIENTES

A área de clientes deverá possuir uma barra de pesquisa.

Exemplo:

🔎 Buscar cliente...

A pesquisa deverá permitir encontrar clientes rapidamente.

Também deverão existir filtros como:

Todos

Ativos

Vencendo

Vencidos

Filtros adicionais poderão ser adicionados posteriormente, como:

Servidor

Aplicativo

7. DETALHES DO CLIENTE

Ao clicar em um cliente da tabela, deverá ser possível abrir uma tela/modal de detalhes.

Essa tela deverá apresentar informações completas do cliente.

Informações previstas:

Nome

Usuário

Telefone

Valor

Data de expiração

Data do último pagamento

Servidor

Aplicativo

Observações

8. OBSERVAÇÕES

A coluna "Observações" não ficará na tabela principal.

A decisão é manter a tabela limpa e organizada.

As observações ficarão disponíveis dentro da página/modal de detalhes do cliente.

Exemplo:

Observações:

"Smart TV Samsung"

9. HISTÓRICO DO CLIENTE

Dentro dos detalhes de cada cliente deverá existir um histórico.

Esse histórico poderá mostrar:

Pagamentos anteriores

Renovações anteriores

Datas

Valores

Servidor utilizado

Outras informações relevantes

Exemplo:

20/08/2026 — R$ 30,00 — Renovação

20/07/2026 — R$ 30,00 — Renovação

20/06/2026 — R$ 30,00 — Renovação

Isso permitirá consultar todo o histórico daquele cliente.

10. AÇÕES DO CLIENTE

A tabela poderá possuir uma pequena área de ações.

Exemplo:

⋮

Ao abrir as ações:

Visualizar

Editar

Renovar

Excluir

A interface deve evitar deixar a tabela visualmente carregada.

11. FINANCEIRO

A área Financeiro será responsável pelo controle financeiro do sistema.

Ela deverá trabalhar com:

Receitas

Recebimentos

Previsão de recebimentos

Recebimentos pendentes

Recebimentos atrasados

Faturamento mensal

Despesas

Custo dos créditos dos servidores

Outras despesas

Gastos mensais

Resultado

Faturamento

Custos

Despesas

Lucro estimado

Lucro líquido

12. CONTROLE DE CRÉDITOS DOS SERVIDORES

O sistema deverá permitir cadastrar o custo de cada crédito/serviço de cada servidor.

Exemplo:

Servidor 1

Custo do crédito mensal: R$ 8,00

Quando um cliente desse servidor for renovado:

Valor cobrado do cliente: R$ 30,00

Custo do crédito: R$ 8,00

Lucro estimado: R$ 22,00

O sistema deverá realizar esse cálculo automaticamente.

13. RELAÇÃO ENTRE CLIENTE, SERVIDOR E FINANCEIRO

O sistema deverá ser estruturado de maneira que as informações estejam relacionadas.

A lógica principal será:

Cliente → Servidor → Aplicativo → Valor cobrado → Custo do crédito → Pagamento → Renovação → Resultado financeiro

Isso permitirá que o sistema faça cálculos automaticamente.

Por exemplo:

Ao renovar um cliente, o sistema poderá identificar:

Qual servidor ele utiliza

Qual o custo daquele servidor

Quanto o cliente pagou

Qual foi o custo da renovação

Qual foi o lucro gerado

Qual será a nova data de expiração

14. RENOVAÇÕES

A área "Renovações" será dedicada ao acompanhamento dos vencimentos.

Filtros previstos:

Vence hoje

Vence amanhã

Próximos 3 dias

Próximos 7 dias

Próximos 30 dias

Vencidos

Também deverá existir a possibilidade de iniciar uma renovação diretamente nessa área.

15. PAGAMENTOS

A área "Pagamentos" será responsável pelo histórico financeiro dos clientes.

Exemplo:

ClienteDataValorStatusJoão Silva10/09/2026R$ 30,00PagoMaria Souza09/09/2026R$ 35,00PagoPedro Santos08/09/2026R$ 30,00Pendente

Deverá ser possível consultar pagamentos por período e cliente.

16. RELATÓRIOS

A área de Relatórios permitirá analisar os dados do sistema.

Possíveis relatórios:

Faturamento por mês

Lucro por mês

Quantidade de clientes

Clientes novos

Clientes cancelados

Clientes ativos

Clientes vencidos

Receita por servidor

Receita por aplicativo

Valor médio por cliente

Essa área poderá receber gráficos futuramente.

17. CONFIGURAÇÕES

A área Configurações será utilizada para cadastrar e gerenciar informações utilizadas pelo sistema.

Possíveis configurações:

Servidores

Nome do servidor

Custo do crédito

Status

Aplicativos

Nome do aplicativo

Informações adicionais

Status

Valores

Valores dos planos/serviços

Custos

Sistema

Configurações gerais

Usuários administrativos

Outras configurações futuras

18. REGRA DE DUPLICIDADE

O sistema deverá possuir proteção contra cadastros duplicados.

Antes de cadastrar um novo cliente, deverá verificar se determinadas informações já estão cadastradas.

Por exemplo:

Usuário já existente

Link já existente, caso esse campo seja utilizado

Se já existir um registro, o sistema deverá impedir o cadastro duplicado e apresentar uma mensagem clara.

Exemplo:

"Este usuário já está cadastrado no sistema."

A estrutura do banco de dados deverá utilizar restrições de unicidade (UNIQUE) quando apropriado, além da validação na aplicação.

19. PRINCÍPIO DE ORGANIZAÇÃO DO SISTEMA

O sistema não deverá ser construído como várias páginas independentes sem relação.

As informações deverão estar conectadas.

Exemplo:

Quando um pagamento for registrado:

O pagamento entra no histórico.

O valor recebido entra no financeiro.

O cliente passa a ter aquele pagamento como último pagamento.

Caso seja uma renovação, a data de expiração é atualizada.

O custo do servidor é considerado.

O lucro da operação pode ser calculado.

O Dashboard é atualizado automaticamente.

Isso evitará a necessidade de cadastrar a mesma informação várias vezes.

20. PRINCÍPIO DE DESENVOLVIMENTO

O projeto deverá ser desenvolvido por etapas.

Não começar todas as funcionalidades simultaneamente.

ETAPA 1 — DASHBOARD

Criar inicialmente:

Estrutura geral do site

Menu lateral

Página Início

Cards

Alertas

Área de próximas renovações

Área de últimos pagamentos

Estrutura visual responsiva

Nesta primeira etapa, o foco será principalmente a estrutura e o design do Dashboard.

ETAPA 2 — CLIENTES

Depois:

Cadastro

Tabela

Pesquisa

Filtros

Detalhes

Edição

Exclusão

Observações

Histórico

ETAPA 3 — FINANCEIRO

Depois:

Receitas

Despesas

Créditos

Custos dos servidores

Cálculo de lucro

Previsões

ETAPA 4 — RENOVAÇÕES

Depois:

Vencimentos

Alertas

Renovação

Atualização automática da expiração

ETAPA 5 — PAGAMENTOS

Depois:

Registro de pagamentos

Histórico

Status

Integração com clientes e financeiro

ETAPA 6 — RELATÓRIOS

Depois:

Gráficos

Indicadores

Filtros

Relatórios financeiros e de clientes

ETAPA 7 — CONFIGURAÇÕES

Por último:

Servidores

Aplicativos

Valores

Usuários

Configurações gerais

21. REGRA IMPORTANTE DO PROJETO

Sempre preservar a estrutura e as regras já definidas.

Novas funcionalidades podem ser adicionadas futuramente, mas não devem alterar ou remover funcionalidades existentes sem uma decisão explícita.

A arquitetura deve ser preparada para crescimento.

O sistema deve priorizar:

Organização

Facilidade de uso

Visual profissional

Rapidez

Segurança

Responsividade

Integridade dos dados

Facilidade de manutenção

Automação de cálculos e processos

22. VISÃO FINAL DO SISTEMA

O sistema deverá funcionar como um painel central de gerenciamento.

O fluxo principal será:

DASHBOARD

↓

CLIENTES

↓

PAGAMENTOS

↓

RENOVAÇÕES

↓

FINANCEIRO

↓

RELATÓRIOS

↓

CONFIGURAÇÕES

Todas essas áreas deverão compartilhar os mesmos dados e funcionar de forma integrada.

O objetivo final é que o administrador consiga abrir o sistema e, em poucos segundos, saber:

Quantos clientes possui

Quem está ativo

Quem está vencido

Quem está prestes a vencer

Quanto recebeu

Quanto ainda irá receber

Quanto gastou

Quanto está lucrando

Qual servidor cada cliente utiliza

Qual aplicativo cada cliente utiliza

Quando cada cliente pagou

Quando cada cliente precisa ser renovado

O sistema deve reduzir ao máximo controles manuais e cálculos feitos fora da plataforma.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e34f09ab-d22f-4d2d-986e-95b5c049f3a3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
