export const projects = [
  {
    id: 1,
    title: 'Autonomax',
    status: 'em-desenvolvimento',
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
    status: 'em-desenvolvimento',
    type: 'Web App & API',
    stacks: ['.NET 10', 'C#', 'Clean Architecture', 'EF Core', 'React', 'TypeScript', 'CSS Modules'],
    summary:
      'Sistema de gestão escolar e financeira voltado para professores particulares e escolas. Organiza agendas de aulas, cadastro e progresso de estudantes, disciplinas de ensino e o fluxo de mensalidades, utilizando arquitetura baseada em DDD.',
    githubUrl: 'https://github.com/allisonrps/Projeto-Aura',
    liveUrl: null,
    image: '/project-aura-alunos-provas.png', // Usar a tela de alunos como capa chamativa
    images: [
      '/project-aura-alunos-provas.png',
      '/project-aura-agenda.png',
      '/project-aura-alunos-horarios.png',
      '/project-aura-alunos-mensalidades.png',
      '/project-aura-alunos-aulas.png',
    ],
  },
  {
    id: 3,
    title: 'Setlist Band Manager',
    status: 'concluido',
    type: 'Mobile App',
    stacks: ['React Native', 'Expo', 'TypeScript', 'SQLite', 'File System', 'Expo Sharing'],
    summary:
      'Aplicativo móvel para organização de bandas e apresentações. Permite o gerenciamento de repertórios de músicas, criação de setlists, roteiros de palco para músicos, controle de ensaios e exportação/compartilhamento de arquivos.',
    githubUrl: 'https://github.com/allisonrps/setlist-app',
    liveUrl: null,
    image: '/project-setlist.jpg',
    images: ['/project-setlist.jpg'],
  },
];
