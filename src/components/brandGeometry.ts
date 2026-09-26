// Vector reconstruction of the supplied iK reference. Text is outlined too,
// so exported logos do not depend on an installed font.
export const brandParts = [
  {
    name: 'dot',
    path: 'M86 10 Q106 -3 106 17 L106 78 Q106 96 91 106 L29 146 Q8 158 8 135 L8 83 Q8 61 28 47 Z',
    loose: 'M33 -18 C93 -22 125 12 118 58 C112 99 60 120 23 96 L40 63 C62 77 83 62 81 43 C80 26 58 15 37 20 Z',
    colors: ['#00cbe9', '#0075ff', '#3422ef'],
    axis: [100, 0, 0, 150],
  },
  {
    name: 'stem',
    path: 'M86 140 Q106 128 106 151 L106 411 Q106 428 88 422 L32 400 Q8 391 8 363 L8 201 Q8 183 25 172 Z',
    loose: 'M-6 167 C-60 206 -38 272 15 292 C59 311 62 357 18 388 L51 429 C138 370 108 280 55 254 C20 237 4 211 25 195 Z',
    colors: ['#00b9f3', '#343afa', '#251299'],
    axis: [80, 140, 12, 430],
  },
  {
    name: 'lower',
    path: 'M239 219 L425 405 Q439 420 421 420 L298 420 Q279 420 265 405 L169 333 Q151 315 178 288 Z',
    loose: 'M205 304 C265 264 319 292 324 340 C332 383 399 373 432 337 L474 359 C429 436 285 449 274 360 C270 336 252 335 228 352 Z',
    colors: ['#062c7e', '#202fb7', '#6017ff'],
    axis: [190, 250, 420, 420],
  },
  {
    name: 'upper',
    path: 'M145 183 L269 59 Q285 43 309 43 L428 43 L180 290 Q153 316 169 333 L143 307 Q132 296 132 276 L132 213 Q132 196 145 183 Z',
    loose: 'M174 18 C300 -20 443 49 390 126 C362 166 270 166 252 200 C229 245 319 265 370 224 L400 264 C335 328 171 286 197 201 C211 146 318 129 343 100 C383 55 278 64 174 70 Z',
    colors: ['#00d1df', '#0099ff', '#2634ff'],
    axis: [360, 45, 135, 320],
  },
] as const

// Geometric lowercase wordmark, reconstructed rather than raster-cropped.
export const wordmark = `
<circle cx="20" cy="22" r="17"/>
<path d="M6 56H34V170H6ZM60 4H89V170H60ZM105 56H135L167 132L199 56H229L154 214H124L152 157Z"/>
<path fill-rule="evenodd" d="M348 114A58 58 0 1 0 320 164V170H348ZM320 114A30 30 0 1 1 260 114A30 30 0 1 1 320 114Z"/>
<path d="M368 4H397V104L439 56H475L427 108L478 170H442L397 116V170H368Z"/>
<path fill-rule="evenodd" d="M592 114A58 58 0 1 0 564 164V170H592ZM564 114A30 30 0 1 1 504 114A30 30 0 1 1 564 114Z"/>
<path d="M608 56H640L673 135L706 56H738L688 170H658Z"/>`
