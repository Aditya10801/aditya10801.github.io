import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import ClickSpark from '@/components/ClickSpark'
import AsciiField from './site/AsciiField'
import Board from './site/Board'
import { ORDER, goto, type ZoneId } from './site/map'
import Cursor from './site/Cursor'
import Terminal from './site/Terminal'
import Hero from './site/Hero'
import About from './site/About'
import Into from './site/Into'
import Hangar from './site/Hangar'
import Design from './site/Design'
import Log from './site/Log'
import Now from './site/Now'
import Contact from './site/Contact'
import FlightHUD from './site/FlightHUD'
import Preloader from './site/Preloader'

export default function App() {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = location.hash.slice(1) as ZoneId
    if (entered && ORDER.includes(id)) setTimeout(() => goto(id), 500)
  }, [entered])

  return (
    <ClickSpark sparkColor={['#ff4f00', '#2f5bff']} sparkCount={9} sparkRadius={26} sparkSize={10} shape="line">
      <AsciiField />
      <Cursor />
      <AnimatePresence>{!entered && <Preloader onEnter={() => setEntered(true)} />}</AnimatePresence>
      {entered && (
        <>
          <Board>
            <Hero />
            <About />
            <Into />
            <Hangar />
            <Design />
            <Log />
            <Now />
            <Contact />
          </Board>
          <FlightHUD />
          <Terminal />
        </>
      )}
    </ClickSpark>
  )
}
