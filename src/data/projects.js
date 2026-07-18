export const projects = [
  {
    id: 1,
    title: 'Autonomax',
    status: 'em-desenvolvimento',
    type: 'Web App',
    stacks: ['.NET 9', 'C#', 'EF Core', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind CSS'],
    summary:
      'Plataforma Fullstack para gestão financeira e fluxo de caixa estratégico, voltada a profissionais autônomos e multi-negócios. Apresenta arquitetura desacoplada, DTOs e segurança multicamadas padrão OWASP.',
    githubUrl: 'https://github.com/allisonrps',
    liveUrl: 'https://autonomax.vercel.app',
    image: '/project-portfolio.jpg',
  },
  {
    id: 2,
    title: 'Smart Ranking',
    status: 'concluido',
    type: 'Backend / API',
    stacks: ['Python (Flask)', 'PostgreSQL', 'React', 'React Native', 'Azure', 'Google Pub/Sub'],
    summary:
      'Plataforma de recomendação inteligente baseada em mineração de dados da Google Play Store. Utiliza algoritmos de Machine Learning (KNN) para personalização de experiências e mensageria assíncrona com Pub/Sub.',
    githubUrl: 'https://github.com/allisonrps',
    liveUrl: 'https://smartranking.vercel.app',
    image: '/project-api.jpg',
  },
  {
    id: 3,
    title: 'Score View',
    status: 'concluido',
    type: 'Backend / Cloud',
    stacks: ['Python', 'Node.js', '.NET Maui', 'MySQL', 'Azure'],
    summary:
      'Sistema de análise de crédito de alta precisão que utiliza modelos preditivos para cálculo de score financeiro e risco de inadimplência. Provisionado no Microsoft Azure com uso de VMs e PM2.',
    githubUrl: 'https://github.com/allisonrps',
    liveUrl: null,
    image: '/project-dashboard.jpg',
  },
  {
    id: 4,
    title: 'Sun Guard (IoT)',
    status: 'concluido',
    type: 'IoT / Backend',
    stacks: ['Node.js', 'MongoDB', 'React', 'React Native', 'Arduino', 'Power BI'],
    summary:
      'Ecossistema de monitoramento ambiental em tempo real voltado à prevenção de exposição a raios UV e segurança do trabalho. Recebe telemetria de sensores Arduino e armazena em MongoDB.',
    githubUrl: 'https://github.com/allisonrps',
    liveUrl: 'https://sun-guard.vercel.app',
    image: '/project-mobile.jpg',
  },
  {
    id: 5,
    title: 'Doctor Link+',
    status: 'concluido',
    type: 'Web App',
    stacks: ['PHP', 'MySQL', 'HTML5', 'CSS3', 'Bootstrap'],
    summary:
      'Evolução de um portal de telemedicina para uma plataforma dinâmica de gestão de atendimentos e especialistas. Conta com CRUD completo e sistema de autenticação seguro.',
    githubUrl: 'https://github.com/allisonrps',
    liveUrl: null,
    image: '/project-api.jpg',
  },
];
