import { useCallback, useState } from 'react'

import { FEATURE_FLAGS } from './config/site'
import { Header } from './components/Header'
import { MobileMenu } from './components/MobileMenu'
import { BottomBar } from './components/BottomBar'
import { Hero } from './sections/Hero'
import { LaptopScene } from './sections/LaptopScene'
import { FlagshipCase } from './sections/FlagshipCase'
import { SelectedWork } from './sections/SelectedWork'
import { MorphScene } from './sections/MorphScene'
import { Range } from './sections/Range'
import { Services } from './sections/Services'
import { Team } from './sections/Team'
import { Process } from './sections/Process'
import { About } from './sections/About'
import { Faq } from './sections/Faq'
import { Testimonials } from './sections/Testimonials'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'

export function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <Header menuOpen={menuOpen} onToggleMenu={toggleMenu} />
      <MobileMenu open={menuOpen} onClose={closeMenu} />

      <main>
        <Hero />
        <LaptopScene />
        <FlagshipCase />
        <SelectedWork />
        <MorphScene />
        <Range />
        <Services />
        <Team />
        <Process />
        <About />
        <Faq />
        {FEATURE_FLAGS.showTestimonials && <Testimonials />}
        <FinalCta />
      </main>

      <BottomBar />
      <Footer />
    </>
  )
}
