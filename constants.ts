import { Partner, PartnerCategory, User, UserRole } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Carlos Tavares',
  email: 'carlos.tavares@email.com',
  role: UserRole.USER,
  plan: 'Gold',
  status: 'Active',
  memberSince: 'Jan 2023',
  memberId: 'TVRS-8892-XP',
  validUntil: 'Dez 2025',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl-r5igg4qh6oOTNG_haP8lFAjH-4ah6IsWancjX8ReRwYoFjk66ANTHkCyAj27BG5RMvPG_RuK2Un1uKCFmy0OitiLszjUkSVDAXfmhHEWcVEDhG1lSEyWNrDcGwvlKQ3ezbBK2VFGw2mkcTwOlG-T8fxwTENxAlOonm0Z4n7HSgcLd1qU3H5y9_d2v81CRFT3VhFQN6WkjJNLzlP2WSHvxEJBwGeGo_GP7uF-mZDWJJgmC2MIoS7RrobXKSIPtdUTrc-_a0CMWNh'
};

export const PARTNERS: Partner[] = [
  // AUTOMOTIVE
  {
    id: 'p1',
    name: 'AutoCenter Elite',
    category: PartnerCategory.AUTOMOTIVE,
    description: 'Serviços de alinhamento e balanceamento com tecnologia 3D.',
    benefit: '30% OFF',
    fullRules: 'Válido para serviços acima de R$ 200,00. Necessário agendamento prévio.',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995470.png',
    coverUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80',
    city: 'São Paulo',
    address: 'Av. Paulista, 1000',
    coordinates: { lat: -23.561684, lng: -46.655981 } // Mock: Paulista
  },
  {
    id: 'p4',
    name: 'Lava Jato Premium',
    category: PartnerCategory.AUTOMOTIVE,
    description: 'Lavagem detalhada com cera importada.',
    benefit: 'Lavagem Grátis (1x/mês)',
    fullRules: 'Exclusivo para assinantes Gold.',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/2061/2061956.png',
    coverUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80',
    city: 'São Paulo',
    address: 'Rua Augusta, 500',
    coordinates: { lat: -23.553174, lng: -46.657574 } // Mock: Augusta
  },
  {
    id: 'p5',
    name: 'Postos Shell',
    category: PartnerCategory.AUTOMOTIVE,
    description: 'Combustível de alta performance para seu veículo.',
    benefit: '5% de Cashback',
    fullRules: 'Válido via Shell Box para abastecimentos acima de R$ 100,00.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Shell_logo.svg/1200px-Shell_logo.svg.png',
    coverUrl: 'https://images.unsplash.com/photo-1545634026-64536697843d?auto=format&fit=crop&q=80',
    city: 'São Paulo',
    address: 'Av. Rebouças, 1200',
    coordinates: { lat: -23.565812, lng: -46.685321 } // Mock: Rebouças
  },
  {
    id: 'p14',
    name: 'Posto Ipiranga',
    category: PartnerCategory.AUTOMOTIVE,
    description: 'Qualidade que você confia. Troca de óleo Jet Oil.',
    benefit: 'R$ 0,15 OFF/litro',
    fullRules: 'Desconto válido para Gasolina Aditivada pagando pelo app.',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2014/05/ipiranga-logo-2.png',
    coverUrl: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&q=80',
    city: 'São Paulo',
    address: 'Rua da Consolação, 800',
    coordinates: { lat: -23.549234, lng: -46.649321 } // Mock: Consolação
  },
  {
    id: 'p6',
    name: 'Movida Aluguel',
    category: PartnerCategory.AUTOMOTIVE,
    description: 'A frota mais nova do Brasil para você.',
    benefit: '15% OFF na Diária',
    fullRules: 'Reserva antecipada pelo site parceiro.',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2017/09/movida-logo.png',
    coverUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80',
    city: 'Nacional',
    isOnline: true,
    website: 'https://www.movida.com.br'
  },

  // FOOD
  {
    id: 'p2',
    name: 'Burger King',
    category: PartnerCategory.FOOD,
    description: 'O melhor hambúrguer grelhado no fogo.',
    benefit: 'Combo por R$ 19,90',
    fullRules: 'Válido para o combo Whopper. Apresente o código no balcão.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Burger_King_logo_%281999%29.svg/2024px-Burger_King_logo_%281999%29.svg.png',
    coverUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80',
    city: 'Nacional',
    address: 'Rede Credenciada'
  },
  {
    id: 'p7',
    name: 'Outback Steakhouse',
    category: PartnerCategory.FOOD,
    description: 'Momentos de celebração com sabor marcante.',
    benefit: 'Bloomin Onion Grátis',
    fullRules: 'Na compra de 2 pratos principais.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Outback_Steakhouse_Logo.svg/1200px-Outback_Steakhouse_Logo.svg.png',
    coverUrl: 'https://images.unsplash.com/photo-1544025162-d76690b67f66?auto=format&fit=crop&q=80',
    city: 'Nacional',
    address: 'Shoppings Credenciados',
    coordinates: { lat: -23.570953, lng: -46.649987 } // Mock: Ibirapuera
  },

  // LIFESTYLE & SHOPPING
  {
    id: 'p3',
    name: 'Barbearia Don Juan',
    category: PartnerCategory.LIFESTYLE,
    description: 'Corte de cabelo e barba com estilo clássico.',
    benefit: '20% OFF',
    fullRules: 'Válido de terça a quinta-feira.',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3655/3655619.png',
    coverUrl: 'https://images.unsplash.com/photo-1503951914290-934c487298f8?auto=format&fit=crop&q=80',
    city: 'Rio de Janeiro',
    address: 'Copacabana, Rua X',
    coordinates: { lat: -22.970722, lng: -43.182365 } // Mock: Copacabana
  },
  {
    id: 'p8',
    name: 'Netshoes',
    category: PartnerCategory.SHOPPING,
    description: 'Artigos esportivos com as melhores marcas.',
    benefit: '15% OFF Extra',
    fullRules: 'Válido para produtos vendidos e entregues por Netshoes.',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2014/11/netshoes-logo-0.png',
    coverUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80',
    city: 'Online',
    isOnline: true,
    website: 'https://www.netshoes.com.br'
  },
  {
    id: 'p9',
    name: 'Vivara',
    category: PartnerCategory.SHOPPING,
    description: 'Joias que contam histórias.',
    benefit: '10% OFF',
    fullRules: 'Exceto coleção Life e relógios.',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2016/10/vivara-logo.png',
    coverUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80',
    city: 'Nacional',
    isOnline: true
  },

  // ENTERTAINMENT & SERVICES
  {
    id: 'p10',
    name: 'Cinemark',
    category: PartnerCategory.ENTERTAINMENT,
    description: 'A melhor experiência de cinema.',
    benefit: '50% OFF no Ingresso',
    fullRules: 'Válido para qualquer sessão 2D ou 3D, exceto salas Prime.',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2015/02/cinemark-logo-0.png',
    coverUrl: 'https://images.unsplash.com/photo-1489599849909-318e0031f1e5?auto=format&fit=crop&q=80',
    city: 'Nacional',
    address: 'Cinemas Credenciados'
  },
  {
    id: 'p11',
    name: 'Spotify Premium',
    category: PartnerCategory.ENTERTAINMENT,
    description: 'Música sem interrupções.',
    benefit: '3 meses Grátis',
    fullRules: 'Apenas para novas contas Premium.',
    logoUrl: 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_CMYK_Green.png',
    coverUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80',
    city: 'Online',
    isOnline: true
  },

  // HEALTH
  {
    id: 'p12',
    name: 'Drogasil',
    category: PartnerCategory.HEALTH,
    description: 'Sua saúde em boas mãos.',
    benefit: 'Até 40% OFF',
    fullRules: 'Em medicamentos genéricos tarjados.',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2018/09/drogasil-logo.png',
    coverUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80',
    city: 'Nacional',
    address: 'Todas as unidades'
  },
  {
    id: 'p13',
    name: 'Smart Fit',
    category: PartnerCategory.HEALTH,
    description: 'A rede de academias inteligente.',
    benefit: 'Taxa Zero na Matrícula',
    fullRules: 'Válido para plano Black.',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2016/10/smart-fit-logo-0.png',
    coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80',
    city: 'Nacional',
    address: 'Unidades Participantes',
    coordinates: { lat: -23.5932, lng: -46.6713 } // Mock: Vila Olímpia
  },
  {
    id: 'p15',
    name: 'TL+ Crédito',
    category: PartnerCategory.FINANCIAL,
    description: 'Soluções financeiras completas.',
    benefit: 'Consórcios e Empréstimos',
    fullRules: 'Consulte condições para cada modalidade.',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/2534/2534204.png', // Temporary placeholder icon
    coverUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80',
    city: 'Nacional',
    isOnline: true,
    address: 'Atendimento Digital'
  }
];

export const INSTAGRAM_POSTS = [
  { id: 1, url: 'https://picsum.photos/id/65/300/300', likes: 1240 },
  { id: 2, url: 'https://picsum.photos/id/66/300/300', likes: 850 },
  { id: 3, url: 'https://picsum.photos/id/67/300/300', likes: 2100 },
  { id: 4, url: 'https://picsum.photos/id/68/300/300', likes: 930 },
  { id: 5, url: 'https://picsum.photos/id/69/300/300', likes: 1500 },
  { id: 6, url: 'https://picsum.photos/id/70/300/300', likes: 3200 },
];

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/tavares_car_oficial_/',
  instagramHandle: '@tavares_car_oficial_',
};