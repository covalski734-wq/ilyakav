import { Hero } from '../sections/Hero'
import { SelectedWork } from '../sections/SelectedWork'
import { Range } from '../sections/Range'
import { Services } from '../sections/Services'
import { Ownership } from '../sections/Ownership'
import { LaptopScene } from '../sections/LaptopScene'
import { MorphScene } from '../sections/MorphScene'
import { Process } from '../sections/Process'
import { Team } from '../sections/Team'
import { Faq } from '../sections/Faq'
import { FinalCta } from '../sections/FinalCta'
import { BottomBar } from '../components/BottomBar'
export function HomePage() {
  return <><Hero /><Range /><LaptopScene /><SelectedWork /><Services />
    <MorphScene><Process /></MorphScene><Ownership /><Team /><Faq /><FinalCta /><BottomBar /></>
}
