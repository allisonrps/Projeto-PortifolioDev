export const projects = [
  {
    id: 1,
    title: 'Autonomax',
    status: 'em-producao',
    type: 'Web App',
    stacks: ['.NET 9', 'C#', 'EF Core 9', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind CSS'],
    summary:
      'Plataforma para gestão financeira estratégica e controle de fluxo de caixa de profissionais autônomos. Desenvolvida com arquitetura desacoplada utilizando DTOs, autenticação JWT, BCrypt, Rate Limiting e testes automatizados com xUnit.',
    githubUrl: 'https://github.com/allisonrps/Autonomax',
    liveUrl: 'https://autonomax.vercel.app',
    image: '/project-autonomax.png',
    images: ['/project-autonomax.png'],
  },
  {
    id: 2,
    title: 'Aura',
    status: 'em-producao', // Menciona que está em produção
    type: 'Web App & API',
    stacks: ['.NET 10', 'C#', 'Clean Architecture', 'EF Core', 'React', 'TypeScript', 'CSS Modules'],
    summary:
      'Sistema de gestão escolar e financeira voltado para professores particulares e escolas. Organiza agendas de aulas, cadastro e progresso de estudantes, disciplinas de ensino e o fluxo de mensalidades, utilizando arquitetura baseada em DDD.',
    githubUrl: null, // Sem o link do github no aura, somente em produção
    liveUrl: 'https://aura-teacher.vercel.app', // Link em produção
    image: '/project-aura-login.png',
    images: [
      '/project-aura-login.png',
      '/project-aura-dashboard.png',
      '/project-aura-alunos.png',
      '/project-aura-agenda.png',
      '/project-aura-financeiro.png',
      '/project-aura-estatisticas.png',
      '/project-aura-aluno-atividades.png',
      '/project-aura-aluno-aulas.png',
      '/project-aura-aluno-horario.png',
      '/project-aura-aluno-mensalidade.png',
      '/project-aura-atividades.png',
      '/project-aura-editor-atividade.png',
      '/project-aura-ficha-publica.png',
      '/project-aura-configuracoes.png',
      '/project-aura-materias-fichas.png',
      '/project-aura-tema-minimalmanga.png',
      '/project-aura-tema-vibrantsquare.png',
    ],
  },
  {
    id: 3,
    title: 'Setlist Band Manager',
    status: 'em-producao', // 3 projetos em produção
    type: 'Mobile App',
    stacks: ['React Native', 'Expo', 'TypeScript', 'SQLite', 'File System', 'Expo Sharing'],
    summary:
      'Aplicativo móvel para organização de bandas e apresentações. Permite o gerenciamento de repertórios de músicas, criação de setlists, roteiros de palco para musicians, controle de ensaios e exportação/compartilhamento de arquivos.',
    githubUrl: 'https://github.com/allisonrps/setlist-app',
    liveUrl: null,
    image: '/project-setlist.jpg',
    images: ['/project-setlist.jpg'],
  },
];
