export const WEB_CASES = {
  skyline: { path: '/case/skyline-stretch-ceilings', url: 'https://skylineceilings.ca/' },
  maryna: { path: '/case/maryna-cleaning', url: 'https://marynacleaning.com/' },
  tile: { path: '/case/tile-expert-solutions', url: 'https://tileexpertsolutions.com/' },
} as const

export type WebCaseId = keyof typeof WEB_CASES
export const WEB_CASE_IDS = Object.keys(WEB_CASES) as WebCaseId[]
export const caseImage = (id: WebCaseId, image: string) => `/media/cases/${id}/${image}.webp`
