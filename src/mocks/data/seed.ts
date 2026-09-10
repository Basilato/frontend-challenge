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
        'Curated digital artwork from the GreenMint marketplace. Collect rare pieces from emerging and established creators.',
      gallery: [img(`${i + 1}`, 900), img(`${i + 1}-b`, 900), img(`${i + 1}-c`, 900)],
      editions: [
        { id: `nft_${i + 1}_ed_std`, label: 'Standard', priceEth: price, available },
        {
          id: `nft_${i + 1}_ed_rare`,
          label: 'Rare',
          priceEth: (Number(price) + 0.5).toFixed(2),
          available: i % 3 === 0 ? 0 : 2,
        },
      ],
      attributes: [
        { trait: 'Collection', value: collection },
        { trait: 'Network', value: NETWORKS[i % NETWORKS.length]! },
        { trait: 'Rarity', value: ['Common', 'Uncommon', 'Rare', 'Legendary'][i % 4]! },
      ],
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
