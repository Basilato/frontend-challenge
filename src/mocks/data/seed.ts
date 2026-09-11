import type { NftDetail, Network, User, Wallet } from '@/contracts'

/**
 * Deterministic seed data for the mock backend. Enough variety to exercise
 * search, every filter, sorting and pagination (CLAUDE.md / MSW guide).
 */

/** Collection taxonomy — matches the filter categories in the Figma sidebar. */
export const COLLECTIONS = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const

const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']
const CREATORS = ['0xKurio', 'studio.green', 'mint.lab', 'arche.type', 'nocturne', 'palette9']
const ADJ = ['Emerald', 'Sage', 'Neon', 'Golden', 'Cosmic', 'Violet', 'Onyx', 'Amber']
const NOUN = ['Ape', 'Nomad', 'Vessel', 'Bot', 'Bloom', 'Hour', 'Mask', 'Relic']

function img(seed: string, size = 600): string {
  return `https://picsum.photos/seed/greenmint-${seed}/${size}/${size}`
}

function priceFor(i: number): string {
  // 0.42 .. 3.99, two decimals, as a string
  const cents = 42 + ((i * 37) % 358)
  return (cents / 100).toFixed(2)
}

export function buildNfts(count = 24): NftDetail[] {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const collection = COLLECTIONS[i % COLLECTIONS.length]!
    const name = `${ADJ[i % ADJ.length]} ${NOUN[(i * 3) % NOUN.length]} #${String(i + 1).padStart(3, '0')}`
    const price = priceFor(i)
    const available = i % 7 === 0 ? 0 : 1 + ((i * 5) % 9)
    const listedAt = new Date(now - i * 36e5).toISOString()
    const createdAt = new Date(now - (i + 5) * 864e5).toISOString()
    return {
      id: `nft_${i + 1}`,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name,
      collection,
      creator: CREATORS[i % CREATORS.length]!,
      image: img(`${i + 1}`),
      priceEth: price,
      network: NETWORKS[i % NETWORKS.length]!,
      available,
      version: 1,
      listedAt,
      createdAt,
      description:
        'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
      longDescription:
        `${name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na rede. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.\n\nA propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede.`,
      // 640px comfortably covers the ~404px display box at 2x DPR — the
      // detail page's gallery image is the LCP element there, and at 900px
      // it was ~2x the bytes this display size ever needed (Lighthouse
      // mobile audit).
      gallery: [
        img(`${i + 1}`, 640),
        img(`${i + 1}-b`, 640),
        img(`${i + 1}-c`, 640),
        img(`${i + 1}-d`, 640),
      ],
      editions: [
        { id: `nft_${i + 1}_ed_std`, label: '1/1', priceEth: price, available: i % 7 === 0 ? 0 : 1 },
        {
          id: `nft_${i + 1}_ed_10`,
          label: '1/10',
          priceEth: (Number(price) + 0.2).toFixed(2),
          available: i % 4 === 0 ? 0 : 3,
        },
        {
          id: `nft_${i + 1}_ed_50`,
          label: '1/50',
          priceEth: (Number(price) + 0.5).toFixed(2),
          available,
        },
        {
          id: `nft_${i + 1}_ed_open`,
          label: 'ABERTA',
          priceEth: (Number(price) + 0.8).toFixed(2),
          available: 99,
        },
      ],
      attributes: [
        { trait: 'Coleção', value: collection },
        { trait: 'Rede', value: NETWORKS[i % NETWORKS.length]! },
        { trait: 'Raridade', value: ['Comum', 'Incomum', 'Raro', 'Lendário'][i % 4]! },
        { trait: 'Traço', value: ['Óculos', 'Esmeralda', 'Chapéu', 'Fone'][i % 4]! },
      ],
      tokenId: `#${String(i + 1).padStart(4, '0')}`,
      contractAddress: `0x7A42${(i * 7).toString(16).padStart(4, '0')}...19E8`,
      royaltiesPct: 5,
      rating: 3.5 + ((i * 7) % 15) / 10,
      reviewCount: 8 + ((i * 13) % 40),
    }
  })
}

export interface SeedUser extends User {
  password: string
}

export const USERS: SeedUser[] = [
  {
    id: 'user_ada',
    name: 'Ada Verde',
    email: 'ada@greenmint.test',
    password: 'senha123',
    avatar: img('ada', 200),
  },
  {
    id: 'user_bruno',
    name: 'Bruno Mata',
    email: 'bruno@greenmint.test',
    password: 'senha123',
    avatar: null,
  },
]

export function walletsFor(userId: string): Wallet[] {
  return [
    {
      id: `${userId}_w_primary`,
      role: 'primary',
      label: 'Carteira principal',
      address: `0x${userId.replace(/[^a-f0-9]/gi, '0').padEnd(40, '0').slice(0, 40)}`,
      networks: ['ethereum', 'polygon'],
    },
  ]
}
