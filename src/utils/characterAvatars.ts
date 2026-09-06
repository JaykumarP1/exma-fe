// 8 distinct, beautifully crafted SVG character avatars for user profile personalization
export interface CharacterAvatar {
  id: string;
  name: string;
  avatarUrl: string;
  badge: string;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const CHARACTER_AVATARS: CharacterAvatar[] = [
  {
    id: 'leo',
    name: 'Leo',
    badge: 'Tech Explorer',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_leo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_leo)"/>
        <!-- Face -->
        <circle cx="50" cy="52" r="28" fill="#fde047"/>
        <!-- Hair -->
        <path d="M26 42 Q50 18 74 42 Q64 30 50 32 Q36 30 26 42 Z" fill="#1e293b"/>
        <!-- Eyes -->
        <circle cx="41" cy="50" r="3.5" fill="#0f172a"/>
        <circle cx="59" cy="50" r="3.5" fill="#0f172a"/>
        <circle cx="42" cy="49" r="1.2" fill="#ffffff"/>
        <circle cx="60" cy="49" r="1.2" fill="#ffffff"/>
        <!-- Glasses -->
        <rect x="34" y="44" width="14" height="12" rx="3" fill="none" stroke="#0ea5e9" stroke-width="2.5"/>
        <rect x="52" y="44" width="14" height="12" rx="3" fill="none" stroke="#0ea5e9" stroke-width="2.5"/>
        <line x1="48" y1="49" x2="52" y2="49" stroke="#0ea5e9" stroke-width="2.5"/>
        <!-- Smile -->
        <path d="M43 64 Q50 72 57 64" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Cheeks -->
        <circle cx="36" cy="58" r="3" fill="#f43f5e" opacity="0.3"/>
        <circle cx="64" cy="58" r="3" fill="#f43f5e" opacity="0.3"/>
      </svg>
    `)
  },
  {
    id: 'maya',
    name: 'Maya',
    badge: 'Finance Lead',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_maya" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#6d28d9"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_maya)"/>
        <!-- Hair Back -->
        <path d="M22 55 C18 78 28 85 30 88 C32 82 28 65 30 52 Z" fill="#312e81"/>
        <path d="M78 55 C82 78 72 85 70 88 C68 82 72 65 70 52 Z" fill="#312e81"/>
        <!-- Face -->
        <circle cx="50" cy="52" r="27" fill="#fed7aa"/>
        <!-- Hair Top -->
        <path d="M23 48 C22 28 40 22 50 22 C60 22 78 28 77 48 C68 34 58 35 50 36 C42 35 32 34 23 48 Z" fill="#312e81"/>
        <!-- Eyes -->
        <ellipse cx="41" cy="52" rx="3.5" ry="4" fill="#1e1b4b"/>
        <ellipse cx="59" cy="52" rx="3.5" ry="4" fill="#1e1b4b"/>
        <circle cx="42" cy="50.5" r="1.2" fill="#ffffff"/>
        <circle cx="60" cy="50.5" r="1.2" fill="#ffffff"/>
        <!-- Smile -->
        <path d="M44 65 Q50 71 56 65" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Cheeks -->
        <circle cx="36" cy="60" r="3.5" fill="#f43f5e" opacity="0.4"/>
        <circle cx="64" cy="60" r="3.5" fill="#f43f5e" opacity="0.4"/>
        <!-- Earrings -->
        <circle cx="23" cy="56" r="2.5" fill="#fbbf24"/>
        <circle cx="77" cy="56" r="2.5" fill="#fbbf24"/>
      </svg>
    `)
  },
  {
    id: 'sam',
    name: 'Sam',
    badge: 'Strategist',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_sam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_sam)"/>
        <!-- Face -->
        <circle cx="50" cy="53" r="28" fill="#ffedd5"/>
        <!-- Beanie / Cap -->
        <path d="M22 46 C22 28 35 22 50 22 C65 22 78 28 78 46 Z" fill="#0f766e"/>
        <rect x="20" y="43" width="60" height="8" rx="3" fill="#14b8a6"/>
        <!-- Eyes -->
        <circle cx="42" cy="55" r="3.5" fill="#0f172a"/>
        <circle cx="58" cy="55" r="3.5" fill="#0f172a"/>
        <circle cx="43" cy="54" r="1.2" fill="#ffffff"/>
        <circle cx="59" cy="54" r="1.2" fill="#ffffff"/>
        <!-- Smile -->
        <path d="M44 67 Q50 74 56 67" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Cheeks -->
        <circle cx="36" cy="62" r="3" fill="#f43f5e" opacity="0.3"/>
        <circle cx="64" cy="62" r="3" fill="#f43f5e" opacity="0.3"/>
      </svg>
    `)
  },
  {
    id: 'elena',
    name: 'Elena',
    badge: 'Analyst',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_elena" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f43f5e"/>
            <stop offset="100%" stop-color="#be123c"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_elena)"/>
        <!-- Face -->
        <circle cx="50" cy="52" r="28" fill="#fef08a"/>
        <!-- Hair Bun -->
        <circle cx="50" cy="22" r="12" fill="#451a03"/>
        <path d="M24 48 C24 30 38 28 50 28 C62 28 76 30 76 48 C68 36 60 36 50 37 C40 36 32 36 24 48 Z" fill="#451a03"/>
        <!-- Eyes -->
        <circle cx="41" cy="51" r="3.5" fill="#451a03"/>
        <circle cx="59" cy="51" r="3.5" fill="#451a03"/>
        <circle cx="42" cy="50" r="1.2" fill="#ffffff"/>
        <circle cx="60" cy="50" r="1.2" fill="#ffffff"/>
        <!-- Glasses -->
        <circle cx="41" cy="51" r="7" fill="none" stroke="#fb7185" stroke-width="2"/>
        <circle cx="59" cy="51" r="7" fill="none" stroke="#fb7185" stroke-width="2"/>
        <line x1="48" y1="51" x2="52" y2="51" stroke="#fb7185" stroke-width="2"/>
        <!-- Smile -->
        <path d="M44 65 Q50 71 56 65" fill="none" stroke="#451a03" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Blush -->
        <ellipse cx="34" cy="59" rx="3.5" ry="2" fill="#f43f5e" opacity="0.45"/>
        <ellipse cx="66" cy="59" rx="3.5" ry="2" fill="#f43f5e" opacity="0.45"/>
      </svg>
    `)
  },
  {
    id: 'kai',
    name: 'Kai',
    badge: 'Innovator',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_kai" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#0e7490"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_kai)"/>
        <!-- Face -->
        <circle cx="50" cy="52" r="28" fill="#fde68a"/>
        <!-- Hair Spiky -->
        <path d="M24 45 L32 25 L42 32 L50 20 L58 32 L68 25 L76 45 Q50 30 24 45 Z" fill="#0f172a"/>
        <!-- Headset band -->
        <path d="M20 52 A30 30 0 0 1 80 52" fill="none" stroke="#38bdf8" stroke-width="3"/>
        <rect x="18" y="47" width="5" height="12" rx="2" fill="#38bdf8"/>
        <rect x="77" y="47" width="5" height="12" rx="2" fill="#38bdf8"/>
        <!-- Eyes -->
        <circle cx="41" cy="52" r="3.5" fill="#0f172a"/>
        <circle cx="59" cy="52" r="3.5" fill="#0f172a"/>
        <circle cx="42" cy="51" r="1.2" fill="#ffffff"/>
        <circle cx="60" cy="51" r="1.2" fill="#ffffff"/>
        <!-- Smile with open tooth -->
        <path d="M43 65 Q50 74 57 65 Z" fill="#0f172a"/>
        <rect x="47" y="65" width="6" height="3" fill="#ffffff" rx="1"/>
      </svg>
    `)
  },
  {
    id: 'aria',
    name: 'Aria',
    badge: 'Creator',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_aria" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ec4899"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_aria)"/>
        <!-- Hair -->
        <path d="M22 55 C20 75 25 88 32 88 C32 75 30 55 30 48 Z" fill="#581c87"/>
        <path d="M78 55 C80 75 75 88 68 88 C68 75 70 55 70 48 Z" fill="#581c87"/>
        <!-- Face -->
        <circle cx="50" cy="52" r="27" fill="#fed7aa"/>
        <!-- Bangs -->
        <path d="M24 45 C28 25 72 25 76 45 C70 38 60 40 50 38 C40 40 30 38 24 45 Z" fill="#581c87"/>
        <!-- Star hairpin -->
        <polygon points="32,32 34,36 38,36 35,39 36,43 32,40 28,43 29,39 26,36 30,36" fill="#fde047"/>
        <!-- Eyes -->
        <circle cx="41" cy="51" r="3.5" fill="#3b0764"/>
        <circle cx="59" cy="51" r="3.5" fill="#3b0764"/>
        <circle cx="42" cy="50" r="1.2" fill="#ffffff"/>
        <circle cx="60" cy="50" r="1.2" fill="#ffffff"/>
        <!-- Smile -->
        <path d="M44 64 Q50 71 56 64" fill="none" stroke="#3b0764" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Cheeks -->
        <circle cx="35" cy="58" r="3" fill="#f43f5e" opacity="0.4"/>
        <circle cx="65" cy="58" r="3" fill="#f43f5e" opacity="0.4"/>
      </svg>
    `)
  },
  {
    id: 'oliver',
    name: 'Oliver',
    badge: 'Executive',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_oliver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_oliver)"/>
        <!-- Face -->
        <circle cx="50" cy="53" r="28" fill="#fef3c7"/>
        <!-- Hair Side-part -->
        <path d="M22 45 C25 24 45 20 50 20 C68 20 78 28 78 45 C70 32 60 30 50 31 C38 31 30 35 22 45 Z" fill="#334155"/>
        <!-- Brows -->
        <line x1="37" y1="45" x2="45" y2="46" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <line x1="55" y1="46" x2="63" y2="45" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <!-- Eyes -->
        <circle cx="41" cy="51" r="3" fill="#0f172a"/>
        <circle cx="59" cy="51" r="3" fill="#0f172a"/>
        <!-- Classic Glasses -->
        <circle cx="41" cy="51" r="7" fill="none" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="59" cy="51" r="7" fill="none" stroke="#f59e0b" stroke-width="2"/>
        <line x1="48" y1="51" x2="52" y2="51" stroke="#f59e0b" stroke-width="2"/>
        <!-- Smile with mustache -->
        <path d="M42 62 Q50 60 58 62" stroke="#475569" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M45 68 Q50 73 55 68" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'tara',
    name: 'Tara',
    badge: 'Founder',
    avatarUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_tara" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#c2410c"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_tara)"/>
        <!-- Face -->
        <circle cx="50" cy="53" r="28" fill="#fed7aa"/>
        <!-- Ponytail Hair -->
        <path d="M68 30 C82 28 88 42 85 52 C82 42 75 35 68 30 Z" fill="#78350f"/>
        <circle cx="70" cy="34" r="4" fill="#fbbf24"/>
        <path d="M22 46 C24 25 45 22 50 22 C65 22 76 28 76 46 C70 34 60 33 50 34 C40 33 30 35 22 46 Z" fill="#78350f"/>
        <!-- Eyes -->
        <ellipse cx="41" cy="52" rx="3.5" ry="4" fill="#451a03"/>
        <ellipse cx="59" cy="52" rx="3.5" ry="4" fill="#451a03"/>
        <circle cx="42" cy="50.5" r="1.2" fill="#ffffff"/>
        <circle cx="60" cy="50.5" r="1.2" fill="#ffffff"/>
        <!-- Smile -->
        <path d="M44 65 Q50 72 56 65" fill="none" stroke="#451a03" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Cheeks -->
        <circle cx="35" cy="60" r="3.5" fill="#f43f5e" opacity="0.35"/>
        <circle cx="65" cy="60" r="3.5" fill="#f43f5e" opacity="0.35"/>
      </svg>
    `)
  }
];

