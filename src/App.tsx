import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import ClickSpark from '@/components/ClickSpark'
import AsciiField from './site/AsciiField'
import Board from './site/Board'
import { ORDER, goto, type ZoneId } from './site/map'
import Cursor from './site/Cursor'
import Terminal from './site/Terminal'
import Hero from './site/Hero'
import FlightHUD from './site/FlightHUD'
import Preloader from './site/Preloader'

// only the hero ships in the first chunk; every other zone streams in right after (they start off screen)
const About = lazy(() => import('./site/About'))
const Into = lazy(() => import('./site/Into'))
const Hangar = lazy(() => import('./site/Hangar'))
const Design = lazy(() => import('./site/Design'))
const Log = lazy(() => import('./site/Log'))
const Now = lazy(() => import('./site/Now'))
const Contact = lazy(() => import('./site/Contact'))
import { armMusic } from './site/sound'

export default function App() {
  const [entered, setEntered] = useState(false)
  const done = useCallback(() => setEntered(true), [])
  useEffect(armMusic, [])

  useEffect(() => {
    const id = location.hash.slice(1) as ZoneId
    if (entered && ORDER.includes(id)) setTimeout(() => goto(id), 500)
  }, [entered])

  return (
    <ClickSpark sparkColor={['#ff4f00', '#2f5bff']} sparkCount={9} sparkRadius={26} sparkSize={10} shape="line">
      <a
        href="#main"
        className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-ink px-4 py-2 font-mono text-[12px] text-bg transition-transform focus:translate-y-0"
      >
        skip to the board
      </a>
      <AsciiField />
      <Cursor />
      <Preloader onDone={done} />
      {entered && (
        <>
          <Board>
            <Hero />
            <Suspense fallback={null}>
              <About />
              <Into />
              <Hangar />
              <Design />
              <Log />
              <Now />
              <Contact />
            </Suspense>
          </Board>
          <FlightHUD />
          <Terminal />
        </>
      )}
    </ClickSpark>
  )
}
